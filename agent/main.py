#!/usr/bin/env python3
"""Linux Patch Monitor Agent

A lightweight agent that collects patch status information from Linux hosts
and sends it to the monitoring server.
"""

import os
import sys
import json
import time
import socket
import platform
import subprocess
import argparse
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
import requests
import psutil
import distro

# Agent version - increment this when releasing new versions
AGENT_VERSION = "1.0.0"

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class PatchMonitorAgent:
    """Main agent class for collecting and sending patch data."""
    
    def __init__(self, server_url: str, agent_token: str, collection_interval: int = 21600):
        """Initialize the agent."""
        self.server_url = server_url.rstrip('/')
        self.agent_token = agent_token
        self.collection_interval = collection_interval
        self.api_url = f"{self.server_url}/api/agents/data"
        self.config_url = f"{self.server_url}/api/agents/config"
        self.version_url = f"{self.server_url}/api/agents/version"
        
    def get_system_info(self) -> Dict[str, Any]:
        """Collect basic system information."""
        try:
            # Get hostname and FQDN
            hostname = socket.gethostname()
            fqdn = socket.getfqdn()
            
            # Get IP addresses
            ip_addresses = []
            for interface, addrs in psutil.net_if_addrs().items():
                for addr in addrs:
                    if addr.family == socket.AF_INET and not addr.address.startswith('127.'):
                        ip_addresses.append(addr.address)
            
            # Get OS information
            os_name = distro.name()
            os_version = distro.version()
            architecture = platform.machine()
            
            # Get kernel version
            kernel_version = platform.release()
            
            # Get boot time
            boot_time = datetime.fromtimestamp(psutil.boot_time(), tz=timezone.utc)
            
            return {
                'hostname': hostname,
                'fqdn': fqdn if fqdn != hostname else None,
                'ip_addresses': ip_addresses,
                'os_name': os_name,
                'os_version': os_version,
                'architecture': architecture,
                'kernel_version': kernel_version,
                'last_boot_time': boot_time.isoformat(),
                'agent_version': AGENT_VERSION
            }
        except Exception as e:
            logger.error(f"Failed to get system info: {e}")
            return {}
    
    def get_package_manager(self) -> Optional[str]:
        """Detect the package manager for this system."""
        package_managers = {
            'apt': ['apt', 'apt-get'],
            'dnf': ['dnf'],
            'yum': ['yum'],
            'zypper': ['zypper'],
            'pacman': ['pacman']
        }
        
        for pm, commands in package_managers.items():
            for cmd in commands:
                try:
                    subprocess.run([cmd, '--version'], 
                                 stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
                    return pm
                except (subprocess.CalledProcessError, FileNotFoundError):
                    continue
        return None
    
    def get_pending_updates(self) -> List[Dict[str, Any]]:
        """Get pending package updates."""
        package_manager = self.get_package_manager()
        if not package_manager:
            logger.warning("No supported package manager found")
            return []
        
        try:
            if package_manager == 'apt':
                return self._get_apt_updates()
            elif package_manager in ['dnf', 'yum']:
                return self._get_dnf_yum_updates(package_manager)
            elif package_manager == 'zypper':
                return self._get_zypper_updates()
            elif package_manager == 'pacman':
                return self._get_pacman_updates()
        except Exception as e:
            logger.error(f"Failed to get pending updates: {e}")
            return []
        
        return []
    
    def _get_apt_updates(self) -> List[Dict[str, Any]]:
        """Get updates for APT-based systems."""
        updates = []
        
        # Try to update package list (optional - may fail without sudo)
        try:
            subprocess.run(['sudo', 'apt', 'update'], 
                         stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30)
            logger.info("APT package list refreshed")
        except:
            # Not critical - we can still read from cache
            logger.debug("Could not refresh APT cache (run 'apt update' manually or grant sudo)")
            pass
        
        # Get security updates list ONCE (much faster than checking each package)
        security_packages = self._get_apt_security_packages()
        
        # Get upgradable packages from cache
        try:
            result = subprocess.run(
                ['apt', 'list', '--upgradable'],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True, check=True
            )
            
            for line in result.stdout.split('\n'):
                if '/' in line and 'upgradable' in line:
                    parts = line.split()
                    if len(parts) >= 2:
                        package_name = parts[0].split('/')[0]
                        current_version = parts[1]
                        available_version = parts[2] if len(parts) > 2 else None
                        
                        # Check if package is in the security list (fast lookup)
                        is_security = package_name in security_packages
                        
                        updates.append({
                            'package_name': package_name,
                            'current_version': current_version,
                            'available_version': available_version,
                            'is_security': is_security,
                            'update_type': 'critical' if is_security else 'low'
                        })
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to list APT updates: {e}")
        
        return updates
    
    def _get_apt_security_packages(self) -> set:
        """Get list of packages with security updates (APT). Fast batch operation."""
        security_packages = set()
        try:
            # Use unattended-upgrades method to find security packages
            result = subprocess.run(
                ['apt-get', '--just-print', 'upgrade'],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True
            )
            
            # Parse output for packages from security repos
            for line in result.stdout.split('\n'):
                if 'Inst' in line and ('security' in line.lower() or 'updates' in line.lower()):
                    parts = line.split()
                    if len(parts) >= 2:
                        package_name = parts[1]
                        security_packages.add(package_name)
        except:
            # If this fails, fall back to empty set (all packages marked as non-security)
            logger.debug("Could not determine security packages, marking all as non-security")
            pass
        
        return security_packages
    
    def _get_dnf_yum_updates(self, package_manager: str) -> List[Dict[str, Any]]:
        """Get updates for DNF/YUM-based systems."""
        updates = []
        
        try:
            # Get security packages list ONCE (much faster)
            security_packages = self._get_dnf_security_packages(package_manager)
            
            # Get available updates
            # Note: dnf/yum returns exit code 100 if updates are available, 0 if none
            # Use --assumeyes to avoid GPG key prompts
            result = subprocess.run(
                [package_manager, 'check-update', '--quiet', '--assumeyes'],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True
            )
            
            # Exit code 0 = no updates, 1 or 100 = updates available, anything else = error
            if result.returncode not in [0, 1, 100]:
                logger.error(f"{package_manager} check-update returned unexpected code {result.returncode}")
            
            # Parse package list - filter out metadata and prompts
            for line in result.stdout.split('\n'):
                line = line.strip()
                # Skip empty lines, metadata, and lines without proper format
                if not line:
                    continue
                if line.startswith('Last metadata'):
                    continue
                if line.startswith('Updating and loading'):
                    continue
                if line.startswith('Repositories loaded'):
                    continue
                if line.startswith('Importing GPG'):
                    continue
                if 'Is this ok' in line:
                    continue
                if ':' in line and not '.' in line:  # Skip header lines like "Repositories:"
                    continue
                    
                parts = line.split()
                # Valid package lines have exactly 3 parts: package.arch, version, repo
                if len(parts) == 3 and '.' in parts[0]:  # Package name must have .arch
                    package_name = parts[0]
                    available_version = parts[1]
                    repository = parts[2]
                    
                    # Check if package is in security list (fast lookup)
                    is_security = package_name in security_packages
                    
                    updates.append({
                        'package_name': package_name,
                        'current_version': 'unknown',  # DNF doesn't show current version
                        'available_version': available_version,
                        'is_security': is_security,
                        'update_type': 'critical' if is_security else 'low'
                    })
        except Exception as e:
            logger.error(f"{package_manager} command failed: {e}")
        
        return updates
    
    def _get_dnf_security_packages(self, package_manager: str) -> set:
        """Get list of packages with security updates (DNF/YUM). Fast batch operation."""
        security_packages = set()
        try:
            # Use updateinfo to get security advisories
            result = subprocess.run(
                [package_manager, 'updateinfo', 'list', 'security', '--quiet'],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True
            )
            
            # Parse output: each line contains package info
            for line in result.stdout.split('\n'):
                line = line.strip()
                if line and not line.startswith('Last metadata'):
                    parts = line.split()
                    # Format: RHSA-2024:1234 Important/Sec. package-name.arch
                    if len(parts) >= 3:
                        # Last part is usually the package name
                        package_name = parts[-1]
                        security_packages.add(package_name)
        except:
            # If this fails, fall back to empty set
            logger.debug("Could not determine security packages for DNF/YUM")
            pass
        
        return security_packages
    
    def _get_zypper_updates(self) -> List[Dict[str, Any]]:
        """Get updates for Zypper-based systems."""
        updates = []
        
        try:
            # Get available updates
            result = subprocess.run(
                ['zypper', 'list-updates'],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True, check=True
            )
            
            for line in result.stdout.split('\n'):
                if '|' in line and not line.startswith('S'):
                    parts = [p.strip() for p in line.split('|')]
                    if len(parts) >= 4:
                        package_name = parts[1]
                        current_version = parts[2]
                        available_version = parts[3]
                        
                        updates.append({
                            'package_name': package_name,
                            'current_version': current_version,
                            'available_version': available_version,
                            'is_security': False,  # Zypper doesn't easily distinguish security updates
                            'update_type': 'low'
                        })
        except subprocess.CalledProcessError as e:
            logger.error(f"Zypper command failed: {e}")
        
        return updates
    
    def _get_pacman_updates(self) -> List[Dict[str, Any]]:
        """Get updates for Pacman-based systems."""
        updates = []
        
        try:
            # Get available updates
            result = subprocess.run(
                ['pacman', '-Qu'],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True, check=True
            )
            
            for line in result.stdout.split('\n'):
                if ' ' in line:
                    parts = line.split()
                    if len(parts) >= 2:
                        package_name = parts[0]
                        current_version = parts[1].split('-')[0]
                        available_version = parts[1]
                        
                        updates.append({
                            'package_name': package_name,
                            'current_version': current_version,
                            'available_version': available_version,
                            'is_security': False,  # Pacman doesn't distinguish security updates
                            'update_type': 'low'
                        })
        except subprocess.CalledProcessError as e:
            logger.error(f"Pacman command failed: {e}")
        
        return updates
    
    
    def get_last_patch_time(self) -> Optional[datetime]:
        """Get the last time packages were updated."""
        package_manager = self.get_package_manager()
        
        try:
            if package_manager == 'apt':
                return self._get_apt_last_patch_time()
            elif package_manager in ['dnf', 'yum']:
                return self._get_dnf_yum_last_patch_time()
            elif package_manager == 'zypper':
                return self._get_zypper_last_patch_time()
            elif package_manager == 'pacman':
                return self._get_pacman_last_patch_time()
        except Exception as e:
            logger.error(f"Failed to get last patch time: {e}")
        
        return None
    
    def _get_apt_last_patch_time(self) -> Optional[datetime]:
        """Get last patch time for APT systems."""
        try:
            result = subprocess.run(
                ['stat', '-c', '%Y', '/var/lib/apt/lists/'],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True, check=True
            )
            timestamp = int(result.stdout.strip())
            return datetime.fromtimestamp(timestamp, tz=timezone.utc)
        except:
            return None
    
    def _get_dnf_yum_last_patch_time(self) -> Optional[datetime]:
        """Get last patch time for DNF/YUM systems."""
        try:
            result = subprocess.run(
                ['stat', '-c', '%Y', '/var/lib/dnf/history/'],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True, check=True
            )
            timestamp = int(result.stdout.strip())
            return datetime.fromtimestamp(timestamp, tz=timezone.utc)
        except:
            return None
    
    def _get_zypper_last_patch_time(self) -> Optional[datetime]:
        """Get last patch time for Zypper systems."""
        try:
            result = subprocess.run(
                ['stat', '-c', '%Y', '/var/log/zypp/history'],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True, check=True
            )
            timestamp = int(result.stdout.strip())
            return datetime.fromtimestamp(timestamp, tz=timezone.utc)
        except:
            return None
    
    def _get_pacman_last_patch_time(self) -> Optional[datetime]:
        """Get last patch time for Pacman systems."""
        try:
            result = subprocess.run(
                ['stat', '-c', '%Y', '/var/log/pacman.log'],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True, check=True
            )
            timestamp = int(result.stdout.strip())
            return datetime.fromtimestamp(timestamp, tz=timezone.utc)
        except:
            return None
    
    def needs_reboot(self) -> bool:
        """Check if the system needs a reboot."""
        try:
            # Check for common reboot indicators
            reboot_indicators = [
                '/var/run/reboot-required',
                '/var/run/reboot-required.pkgs'
            ]
            
            for indicator in reboot_indicators:
                if os.path.exists(indicator):
                    return True
            
            # Check for kernel updates that require reboot
            package_manager = self.get_package_manager()
            if package_manager == 'apt':
                result = subprocess.run(
                    ['uname', '-r'],
                    stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True, check=True
                )
                current_kernel = result.stdout.strip()
                
                # Check if there's a newer kernel installed
                result = subprocess.run(
                    ['dpkg', '-l', 'linux-image-*'],
                    stdout=subprocess.PIPE, stderr=subprocess.PIPE, universal_newlines=True, check=True
                )
                
                for line in result.stdout.split('\n'):
                    if 'ii' in line and 'linux-image-' in line:
                        kernel_version = line.split()[1].replace('linux-image-', '')
                        if kernel_version != current_kernel:
                            return True
            
            return False
        except Exception as e:
            logger.error(f"Failed to check reboot status: {e}")
            return False
    
    def collect_data(self) -> Dict[str, Any]:
        """Collect all patch monitoring data."""
        logger.info("Collecting patch monitoring data")
        
        system_info = self.get_system_info()
        pending_updates = self.get_pending_updates()
        last_patch_time = self.get_last_patch_time()
        needs_reboot_flag = self.needs_reboot()
        
        # Count security updates
        security_updates = [u for u in pending_updates if u.get('is_security', False)]
        
        data = {
            **system_info,
            'agent_version': '1.0.0',
            'last_patch_time': last_patch_time.isoformat() if last_patch_time else None,
            'pending_updates': pending_updates,
            'needs_reboot': needs_reboot_flag
        }
        
        logger.info(f"Collected data: {len(pending_updates)} pending updates, "
                   f"{len(security_updates)} security updates")
        
        return data
    
    def send_data(self, data: Dict[str, Any]) -> bool:
        """Send collected data to the server."""
        try:
            headers = {
                'Authorization': f'Bearer {self.agent_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.post(
                self.api_url,
                json=data,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                logger.info("Data sent successfully")
                return True
            else:
                logger.error(f"Failed to send data: {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error sending data: {e}")
            return False
    
    def get_config(self) -> Optional[Dict[str, Any]]:
        """Get configuration from the server."""
        try:
            headers = {
                'Authorization': f'Bearer {self.agent_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                self.config_url,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to get config: {response.status_code}")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error getting config: {e}")
            return None
    
    def check_for_updates(self) -> None:
        """Check if a newer agent version is available."""
        try:
            headers = {
                'Authorization': f'Bearer {self.agent_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                self.version_url,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                version_info = response.json()
                latest_version = version_info.get('latest_version')
                
                if latest_version and latest_version != AGENT_VERSION:
                    logger.warning(f"New agent version available: {latest_version} (current: {AGENT_VERSION})")
                    logger.info(f"Run 'sudo systemctl restart patchmonitor-agent' to update")
                else:
                    logger.debug(f"Agent is up to date: {AGENT_VERSION}")
            else:
                logger.debug(f"Could not check for updates: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            logger.debug(f"Network error checking for updates: {e}")
            # Don't log as error since this is not critical
    
    def run_once(self) -> bool:
        """Run data collection once."""
        try:
            data = self.collect_data()
            return self.send_data(data)
        except Exception as e:
            logger.error(f"Error in run_once: {e}")
            return False
    
    def run_daemon(self):
        """Run the agent as a daemon."""
        logger.info(f"Starting patch monitor agent (interval: {self.collection_interval}s)")
        
        while True:
            try:
                # Get updated config from server
                config = self.get_config()
                if config:
                    self.collection_interval = config.get('collection_interval_minutes', self.collection_interval) * 60
                
                # Check for agent updates (every 6 hours)
                self.check_for_updates()
                
                # Collect and send data
                success = self.run_once()
                
                if success:
                    logger.info("Data collection cycle completed successfully")
                else:
                    logger.warning("Data collection cycle failed")
                
                # Wait for next collection
                logger.info(f"Waiting {self.collection_interval} seconds until next collection")
                time.sleep(self.collection_interval)
                
            except KeyboardInterrupt:
                logger.info("Agent stopped by user")
                break
            except Exception as e:
                logger.error(f"Unexpected error in daemon: {e}")
                time.sleep(60)  # Wait 1 minute before retrying


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='Linux Patch Monitor Agent')
    parser.add_argument('--server-url', required=True, help='Monitoring server URL')
    parser.add_argument('--token', required=True, help='Agent authentication token')
    parser.add_argument('--interval', type=int, default=3600, help='Collection interval in seconds')
    parser.add_argument('--once', action='store_true', help='Run once instead of daemon mode')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    agent = PatchMonitorAgent(
        server_url=args.server_url,
        agent_token=args.token,
        collection_interval=args.interval
    )
    
    if args.once:
        success = agent.run_once()
        sys.exit(0 if success else 1)
    else:
        agent.run_daemon()


if __name__ == '__main__':
    main()
