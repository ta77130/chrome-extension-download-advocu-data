# Privacy Policy for WTM Ambassador Activity Exporter

**Last Updated:** October 10, 2025

## Overview

WTM Ambassador Activity Exporter is a Chrome extension that helps Women Techmakers Ambassadors export their activity data from the WTM Advocu platform for personal backup and record-keeping purposes.

## Data Collection and Usage

### What Data We Access

The extension accesses:
- Your WTM Advocu profile information (name, location, bio, skills, etc.)
- Your activity data (events, resources, mentorship sessions, speaking engagements)
- Your activity images hosted on Google Cloud Storage
- Authentication tokens from your browser session (temporarily, only while extracting data)

### How We Use This Data

- **Local Processing Only**: All data processing happens locally in your browser
- **No External Servers**: We do not send your data to any external servers
- **No Analytics**: We do not collect analytics or usage statistics
- **No Tracking**: We do not track your browsing behavior
- **Export Only**: Data is only used to generate export files (JSON, Excel, HTML) that are saved directly to your computer

### Authentication Token Handling

- Authentication tokens are captured temporarily from network requests to the WTM Advocu API
- Tokens are stored locally in Chrome's storage API only for the duration of data extraction
- Tokens are never transmitted to any third-party servers
- Tokens are used solely to authenticate API requests to the WTM Advocu platform

### Data Storage

- **Chrome Storage API**: Temporarily stores authentication tokens in your local browser storage
- **Downloaded Files**: All exported data is saved directly to your computer
- **No Cloud Storage**: We do not store any of your data in the cloud or on any servers

## Permissions Explanation

The extension requires the following permissions:

- **activeTab**: To access the current WTM Advocu page you're viewing
- **downloads**: To save exported files to your computer
- **storage**: To temporarily store authentication tokens locally for session persistence
- **webRequest**: To capture authentication tokens from API requests to access your own data
- **host_permissions (wtm.advocu.com)**: To access WTM Advocu pages where you're viewing your profile
- **host_permissions (api-wtm.advocu.com)**: To make API requests to fetch your activity data
- **host_permissions (storage.googleapis.com)**: To download activity images that are part of your activities

Note: This extension uses content scripts (declared in manifest.json) to extract data from the page, not programmatic script injection.

## Third-Party Services

This extension interacts with:
- **WTM Advocu** (wtm.advocu.com): To fetch your activity data
- **Google Cloud Storage** (storage.googleapis.com): To download activity images

We do not share your data with any third-party services beyond what's necessary to fetch it from the WTM Advocu platform.

## Data Security

- All data processing occurs locally in your browser
- Authentication tokens are stored securely using Chrome's Storage API
- No data is transmitted to external servers controlled by the extension developer
- Exported files are saved directly to your computer under your control

## User Control

You have complete control over your data:
- You decide when to extract data by clicking the "Extract Data" button
- You choose what to download (JSON, Excel, or complete ZIP backup)
- You can uninstall the extension at any time
- Uninstalling will remove all locally stored authentication tokens

## Children's Privacy

This extension is not directed at children under 13 and does not knowingly collect information from children.

## Changes to This Policy

We may update this privacy policy from time to time. Any changes will be reflected in the extension's documentation and Chrome Web Store listing.

## Contact

For questions about this privacy policy or the extension:
- GitHub Issues: https://github.com/julissarparco/chrome-extension-download-advocu-data/issues
- Email: hola@codeanding.com

## Compliance

This extension:
- Does not collect personal information for advertising purposes
- Does not use or transfer data for purposes unrelated to its core functionality
- Complies with Chrome Web Store's Limited Use policy
- Only accesses WTM Advocu domains as specified in the manifest

## Open Source

This extension is open source. You can review the source code to verify these privacy practices.

---

By using WTM Ambassador Activity Exporter, you agree to this privacy policy.
