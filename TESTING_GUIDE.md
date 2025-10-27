# Slack MCP Integration - Test Guide

This guide provides comprehensive testing procedures for the Slack MCP (Modular Connector Plugin) integration with frontend UI.

## 🧪 Testing Overview

### Test Environment Setup

1. **Start the Next.js application**:
   ```powershell
   cd c:\Users\lenovo\Desktop\Pario
   npm run dev
   ```

2. **Verify backend services are running**:
   - Nango dashboard accessible
   - Slack MCP backend endpoints responding
   - Environment variables properly configured

## 🔍 Component Testing

### 1. Home Page Testing

**Navigate to**: `http://localhost:3000`

**Test Cases**:
- [ ] Page loads without errors
- [ ] Integration cards display correctly
- [ ] "Go to Slack Integration" button works
- [ ] "View Documentation" button links correctly
- [ ] Responsive design on mobile/tablet
- [ ] All text content renders properly

**Expected Results**:
- Clean layout with Pario branding
- Slack integration card shows "Available" status
- Other integration cards show "In Development"
- Developer-focused hero section displays

### 2. Slack Integration Dashboard

**Navigate to**: `http://localhost:3000/integrations/slack`

#### Connection Flow Testing

**Test Case A: OAuth Connection**
1. Click "Connect with Slack" button
2. Verify redirect to Slack OAuth
3. Complete authorization
4. Return to dashboard

**Expected Results**:
- [ ] Button shows Slack branding
- [ ] Loading state appears during redirect
- [ ] OAuth flow completes successfully
- [ ] Connection status updates to "Connected"

**Test Case B: Manual Connection**
1. Toggle to "Manual Setup"
2. Enter valid Nango connection ID
3. Click "Set Connection"

**Expected Results**:  
- [ ] Form validates input
- [ ] Connection status updates
- [ ] Health check runs automatically

#### Connection Status Testing

**Test Cases**:
- [ ] Status indicator shows correct color
- [ ] Health check details populate
- [ ] Refresh button updates status
- [ ] Timestamp shows last check time

**Status Scenarios**:
- **Healthy**: Green indicator, all checks pass
- **Warning**: Yellow indicator, some issues detected
- **Error**: Red indicator, connection failed

#### Message Sending Testing

**Test Case A: Channel Selection**
1. Ensure connection is active
2. Open channel dropdown
3. Select a channel
4. Enter test message
5. Click "Send Message"

**Expected Results**:
- [ ] Dropdown populates with channels
- [ ] Loading indicator during channel fetch
- [ ] Selected channel appears in field
- [ ] Message sends successfully
- [ ] Success notification displays

**Test Case B: Manual Channel Input**
1. Toggle to "Manual Channel Input"
2. Enter channel name (e.g., "#general")
3. Enter test message
4. Send message

**Expected Results**:
- [ ] Manual input accepts various formats
- [ ] Validation works for invalid channels
- [ ] Error messages for unauthorized channels

## 🎯 Integration Testing

### Backend API Integration

**Test all API endpoints through the UI**:

#### 1. Connection Health Check
```
Endpoint: /api/integrations/slack/health
UI Component: ConnectionStatus
```

**Test Steps**:
1. Connect to Slack
2. Monitor connection status card
3. Click "Refresh Status"

**Verify**:
- [ ] Health status updates correctly
- [ ] API response time reasonable
- [ ] Error handling for disconnected state

#### 2. Channel List Retrieval
```
Endpoint: /api/integrations/slack/channels
UI Component: SendMessageForm dropdown
```

**Test Steps**:
1. Open channel dropdown
2. Wait for channels to load
3. Verify channel list accuracy

**Verify**:
- [ ] All accessible channels appear
- [ ] Private channels included (if bot has access)
- [ ] Loading state during fetch
- [ ] Error handling for API failures

#### 3. Message Sending
```
Endpoint: /api/integrations/slack/send-message
UI Component: SendMessageForm
```

**Test Steps**:
1. Select channel
2. Enter message content
3. Click send
4. Verify message appears in Slack

**Verify**:
- [ ] Message appears in correct channel
- [ ] Special characters render correctly
- [ ] Long messages handle properly
- [ ] Rate limiting respected

## 🚨 Error Scenario Testing

### Network Error Handling

**Test Case: Network Disconnection**
1. Disconnect internet
2. Try to send message
3. Reconnect internet
4. Verify retry mechanisms

**Expected Results**:
- [ ] Error alert displays
- [ ] Retry button appears
- [ ] Success after reconnection

### Invalid Input Testing

**Test Case: Invalid Channels**
1. Enter non-existent channel name
2. Try to send message

**Expected Results**:
- [ ] Validation error message
- [ ] Suggested corrections if available
- [ ] No message sent to Slack

**Test Case: Empty Messages**
1. Leave message field blank
2. Try to send

**Expected Results**:
- [ ] Client-side validation prevents send
- [ ] Error message displays
- [ ] Send button remains disabled

### Authentication Error Testing

**Test Case: Expired Token**
1. Manually invalidate Slack token
2. Try to perform actions

**Expected Results**:
- [ ] Authentication error detected
- [ ] Re-authentication prompt
- [ ] Graceful error handling

## 📱 UI/UX Testing

### Responsive Design Testing

**Screen Sizes to Test**:
- [ ] Mobile (320px - 768px)
- [ ] Tablet (768px - 1024px)  
- [ ] Desktop (1024px+)
- [ ] Ultra-wide (1440px+)

**Components to Verify**:
- [ ] Navigation collapses on mobile
- [ ] Cards stack vertically on small screens
- [ ] Forms remain usable on all sizes
- [ ] Text remains readable at all sizes

### Loading State Testing

**Components with Loading States**:
- [ ] ConnectButton during OAuth
- [ ] ConnectionStatus during health checks
- [ ] SendMessageForm during message send
- [ ] Channel dropdown during fetch

**Verify**:
- [ ] Loading spinners appear
- [ ] Buttons show loading state
- [ ] Content doesn't jump during load
- [ ] Reasonable loading times

### Accessibility Testing

**Keyboard Navigation**:
- [ ] Tab order is logical
- [ ] All interactive elements accessible
- [ ] Focus indicators visible
- [ ] Modal/dropdown navigation works

**Screen Reader Testing**:
- [ ] Alt text on images
- [ ] Proper heading hierarchy
- [ ] Form labels associated correctly
- [ ] Status updates announced

## 🔧 Performance Testing

### Load Testing

**Test Scenarios**:
1. **Large Channel Lists**: Workspaces with 100+ channels
2. **Rapid Actions**: Quick successive message sends
3. **Long Sessions**: Extended use without refresh

**Metrics to Monitor**:
- [ ] Initial page load time
- [ ] Component render time
- [ ] Memory usage over time
- [ ] Network request efficiency

### Optimization Verification

**Check for**:
- [ ] Image optimization
- [ ] Bundle size reasonable
- [ ] No memory leaks
- [ ] Efficient re-renders

## 📊 Test Results Documentation

### Test Result Template

```markdown
## Test Session: [Date]

### Environment
- Browser: [Chrome/Firefox/Safari]
- Screen Size: [Desktop/Tablet/Mobile]
- Connection: [Connected/Manual/Disconnected]

### Results Summary
- ✅ Passed Tests: [X/Y]
- ❌ Failed Tests: [Details]
- ⚠️ Issues Found: [List]

### Detailed Results
[Component] - [Test Case] - [Pass/Fail] - [Notes]

### Issues Identified
1. [Issue Description]
   - Severity: [High/Medium/Low]
   - Steps to Reproduce: [Steps]
   - Expected vs Actual: [Description]

### Recommendations
[Improvement suggestions]
```

## 🚀 Performance Benchmarks

### Expected Performance Metrics

**Page Load Times**:
- Home Page: < 2 seconds
- Slack Integration: < 3 seconds
- Component Mounting: < 500ms

**API Response Times**:
- Health Check: < 1 second
- Channel List: < 3 seconds
- Send Message: < 2 seconds

**User Experience**:
- Button Click Response: < 100ms
- Form Validation: Immediate
- Error Messages: < 500ms

## 🎯 Success Criteria

### Functional Requirements
- [ ] OAuth connection flow works end-to-end
- [ ] Manual connection setup functions
- [ ] Message sending to public channels
- [ ] Channel list retrieval and display
- [ ] Connection health monitoring
- [ ] Error handling and recovery

### Quality Requirements
- [ ] No JavaScript errors in console
- [ ] All API calls handle errors gracefully
- [ ] UI remains responsive under load
- [ ] Mobile experience fully functional
- [ ] Accessibility standards met

### Integration Requirements
- [ ] Backend API integration complete
- [ ] Nango OAuth flow functional
- [ ] Slack workspace permissions work
- [ ] Real-time status updates
- [ ] Data persistence between sessions

---

## 🔍 Manual Testing Checklist

Print this checklist for comprehensive manual testing:

### Pre-Testing Setup
- [ ] Environment variables configured
- [ ] Backend services running
- [ ] Test Slack workspace prepared
- [ ] Browser dev tools open

### Home Page Tests
- [ ] Page loads correctly
- [ ] Navigation works
- [ ] Responsive design verified
- [ ] All links functional

### Slack Integration Tests
- [ ] OAuth connection successful
- [ ] Manual connection works
- [ ] Connection status accurate
- [ ] Health checks function
- [ ] Channel list populates
- [ ] Message sending works
- [ ] Error handling tested

### Cross-Browser Tests
- [ ] Chrome compatibility
- [ ] Firefox compatibility
- [ ] Safari compatibility (if Mac available)
- [ ] Edge compatibility

### Performance Tests
- [ ] Load times acceptable
- [ ] No memory leaks detected
- [ ] Smooth user interactions
- [ ] Efficient API usage

### Final Verification
- [ ] All major features working
- [ ] No critical bugs found
- [ ] Ready for production use
- [ ] Documentation complete

**Test Completed By**: _________________

**Date**: _________________

**Overall Status**: ✅ Pass / ❌ Fail / ⚠️ Issues Found

**Notes**: ________________________________