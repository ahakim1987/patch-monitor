# User Guide

This guide explains how to use the Linux Patch Monitor dashboard and features.

## Getting Started

### Login

1. Open your web browser and navigate to the Patch Monitor URL
2. Enter your username and password
3. Click "Sign In"

**Default credentials:**
- Username: `admin`
- Password: `admin123`

> **Important:** Change the default password immediately after first login.

## Dashboard Overview

The dashboard provides a comprehensive view of your Linux hosts and their patch status.

### Key Metrics

The dashboard displays four key metrics:

- **Total Hosts**: Number of monitored hosts
- **Healthy Hosts**: Hosts with no pending updates
- **Security Patches**: Total pending security updates
- **Reboot Required**: Hosts needing a reboot

### Host Status Indicators

Each host is color-coded based on its status:

- 🟢 **Green (Healthy)**: Fully patched, no pending updates
- 🟡 **Yellow (Updates Pending)**: Has non-security updates available
- 🟠 **Orange (Stale)**: Hasn't been patched in 30+ days
- 🔴 **Red (Security Updates)**: Has pending security updates
- ⚫ **Gray (Offline/Error)**: Host is unreachable or has errors

### Charts

The dashboard includes two charts:

1. **Host Status Distribution**: Pie chart showing the breakdown of host statuses
2. **Patch Lag Distribution**: Bar chart showing how long hosts have been unpatched

## Host Management

### Viewing Hosts

1. **Dashboard View**: See all hosts in a grid layout with key information
2. **Host Detail View**: Click on any host to see detailed information

### Host Detail Page

The host detail page provides comprehensive information about a specific host:

#### System Information
- Operating system and version
- Architecture
- Agent version
- IP addresses
- Last collection time

#### Patch Status
- Last patch date and time
- Days since last patch
- Pending updates count (total and security)
- Reboot requirement status

#### Pending Updates Table
- Package name
- Current version
- Available version
- Update type (security/regular)
- Associated CVEs (if available)

#### Recent Activity
- Timeline of recent patch events
- Collection history
- System changes

### Filtering and Search

Use the search and filter options to find specific hosts:

- **Search**: Type hostname or IP address
- **Status Filter**: Filter by host status (Online, Offline, Error)
- **OS Filter**: Filter by operating system (Ubuntu, Debian, RHEL, etc.)

## Reports

### Compliance Report

The compliance report shows:

- Overall compliance percentage
- Hosts by compliance status
- Vulnerability summary by severity
- Historical trends

### Vulnerability Report

The vulnerability report displays:

- Total CVEs across all hosts
- CVE breakdown by severity
- Affected hosts count
- Security update priorities

### Exporting Reports

Reports can be exported in multiple formats:

- **PDF**: Formatted, print-ready reports
- **CSV**: Raw data for analysis
- **JSON**: API-friendly format

## Alerts and Notifications

### Alert Types

The system generates alerts for:

- **Patch Lag**: Hosts not patched in X days
- **Critical CVE**: Hosts with critical security updates
- **Offline**: Hosts that haven't reported in
- **Reboot Required**: Hosts needing a reboot

### Managing Alerts

1. **View Alerts**: Check the alerts section for active alerts
2. **Acknowledge**: Mark alerts as acknowledged
3. **Configure**: Set alert thresholds and notification channels

## Settings

### General Settings

- Application name
- Collection interval
- Data retention period
- Timezone configuration

### User Management

- Create new users
- Assign roles (Admin, Operator, Viewer)
- Manage permissions
- Enable/disable accounts

### Alert Configuration

- Email notification settings
- Alert thresholds
- Notification channels
- Quiet periods

### Security Settings

- Session timeout
- Password policies
- MFA configuration
- API security settings

## User Roles

### Admin
- Full system access
- User management
- System configuration
- All host operations

### Operator
- View all data
- Acknowledge alerts
- Add notes to hosts
- Export reports

### Viewer
- Read-only access
- View dashboards and reports
- No modification permissions

## Best Practices

### Monitoring Strategy

1. **Regular Review**: Check the dashboard daily for new alerts
2. **Prioritize Security**: Address security updates immediately
3. **Maintenance Windows**: Plan patching during appropriate times
4. **Documentation**: Use notes to track maintenance activities

### Alert Management

1. **Set Appropriate Thresholds**: Configure alerts based on your policies
2. **Regular Acknowledgment**: Keep alerts up to date
3. **Escalation Procedures**: Define who handles different alert types
4. **Review and Tune**: Regularly review alert effectiveness

### Host Management

1. **Consistent Naming**: Use consistent hostname conventions
2. **Grouping**: Use tags to group related hosts
3. **Documentation**: Add notes for special configurations
4. **Regular Updates**: Keep agent software updated

## Troubleshooting

### Common Issues

#### Host Not Appearing
1. Check if agent is installed and running
2. Verify network connectivity
3. Check agent logs for errors
4. Confirm authentication token

#### Incorrect Patch Status
1. Verify agent is collecting data correctly
2. Check package manager configuration
3. Review agent logs for collection errors
4. Test manual data collection

#### Dashboard Not Loading
1. Check browser console for errors
2. Verify backend API is running
3. Check network connectivity
4. Clear browser cache

#### Alerts Not Working
1. Verify alert configuration
2. Check notification settings
3. Review alert thresholds
4. Test alert generation

### Getting Help

1. **Check Logs**: Review system logs for error messages
2. **Documentation**: Consult this guide and API documentation
3. **Support**: Contact your system administrator
4. **Community**: Check project documentation and forums

## Keyboard Shortcuts

- `Ctrl + R`: Refresh dashboard
- `Ctrl + F`: Focus search box
- `Esc`: Close modals/dialogs
- `Enter`: Submit forms
- `Tab`: Navigate between elements

## Mobile Access

The dashboard is responsive and works on mobile devices:

- **Dashboard**: Optimized for mobile viewing
- **Host Cards**: Touch-friendly interface
- **Reports**: Responsive charts and tables
- **Settings**: Mobile-optimized forms

## API Access

For advanced users, the system provides a REST API:

- **Documentation**: Available at `/api/docs`
- **Authentication**: Bearer token required
- **Rate Limiting**: 100 requests per minute
- **Examples**: See API documentation for usage examples

## Data Retention

- **Host Data**: Retained for 90 days by default
- **Snapshots**: Compressed after 7 days
- **Logs**: Retained for 30 days
- **Alerts**: Retained for 90 days

## Security Considerations

1. **Access Control**: Use strong passwords and MFA
2. **Network Security**: Restrict access to monitoring server
3. **Data Protection**: Encrypt sensitive data
4. **Regular Updates**: Keep all components updated
5. **Audit Logging**: Monitor user activities

## Performance Tips

1. **Pagination**: Use pagination for large host lists
2. **Filtering**: Use filters to reduce data load
3. **Refresh Rate**: Adjust auto-refresh based on needs
4. **Browser**: Use modern browsers for best performance
5. **Network**: Ensure stable network connection
