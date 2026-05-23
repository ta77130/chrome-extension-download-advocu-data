# WTM Ambassador Activity Exporter
TAWFIK QERAN 
> A Chrome extension to export and backup your Women Techmakers Ambassador activity data from WTM Advocu

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-brightgreen)](https://chrome.google.com/webstore)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/manifest-v3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)

## ✨ Features

- **Complete Data Export**: Extract all your WTM Ambassador activities including events, resources, mentorship sessions, and speaking engagements
- **Multiple Export Formats**:
  - 📄 JSON - Structured data for developers
  - 📊 Excel (XLSX) - Multi-sheet workbook with organized data
  - 🗂️ ZIP Backup - Complete offline backup including images
  - 🌐 HTML Viewer - Beautiful visual report with WTM branding
- **Profile Information**: Automatically extracts your profile data, bio, skills, and social links
- **Image Backup**: Downloads all activity images for offline viewing
- **Data Persistence**: Caches extracted data so you don't lose it if you close the popup
- **Privacy First**: All processing happens locally in your browser - no external servers

## 📦 Installation

### From Chrome Web Store (Recommended)

*Coming soon - Extension is currently under review*

### Manual Installation (Development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/julissarparco/chrome-extension-download-advocu-data.git
   cd chrome-extension-download-advocu-data
   ```

2. **Load the extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the extension folder
   - The extension should now appear in your extensions list

3. **Pin the extension** (Optional)
   - Click the puzzle piece icon in Chrome's toolbar
   - Find "WTM Ambassador Activity Exporter"
   - Click the pin icon to keep it visible

## 🚀 Usage

1. **Navigate to your WTM Advocu profile**
   - Go to [wtm.advocu.com](https://wtm.advocu.com)
   - Make sure you're logged in
   - Navigate to your ambassador profile page

2. **Extract your data**
   - Click the extension icon in Chrome's toolbar
   - Click "Extract Data" button
   - The extension automatically captures your auth token and fetches data from the API
   - Wait for extraction to complete (you'll see a success message)

3. **Download your data**
   - Choose your preferred export format:
     - **JSON** - For raw data or importing into other tools
     - **Excel** - For spreadsheet analysis (5 organized sheets)
     - **ZIP Backup** - Complete backup with images and HTML viewer

4. **View offline**
   - If you downloaded the ZIP backup, extract it
   - Open `index.html` in any browser for a beautiful visual report
   - All images are included locally - no internet required!

## 📊 Data Exports

### Excel Workbook Structure

The Excel file contains 5 sheets:
- **Summary** - Activity statistics and metrics
- **Events** - Community events you've organized or attended
- **Resources** - Blog posts, articles, and resources you've created
- **Mentorship** - Mentorship sessions you've conducted
- **Speaking Engagements** - Talks and presentations you've delivered

### HTML Viewer

The ZIP backup includes a beautiful HTML viewer with:
- Your profile with photo and biography
- Activity statistics dashboard
- Organized tabs for each activity type
- Activity cards with images and descriptions
- WTM branding and colors
- Works completely offline!

## 🛠️ Built With

- **Chrome Extension Manifest V3** - Latest Chrome extension platform
- **JSZip** - Creating ZIP archives with images
- **SheetJS (xlsx.js)** - Generating Excel workbooks
- **WTM Advocu API** - Fetching activity data
- Vanilla JavaScript - No framework dependencies

## 🔒 Privacy & Security

- ✅ **Local Processing Only** - All data processing happens in your browser
- ✅ **No External Servers** - Your data is never sent to any third-party servers
- ✅ **No Analytics** - We don't collect any usage statistics
- ✅ **No Tracking** - We don't track your browsing behavior
- ✅ **Open Source** - You can review all the code

For more details, see our [Privacy Policy](PRIVACY_POLICY.md).

## 🐛 Troubleshooting

### Extension doesn't work
- Make sure you're on `wtm.advocu.com`
- Refresh the page and try again
- Check that you're logged into WTM Advocu

### "Authentication token not found" error
- Navigate around the page (scroll, click tabs) to trigger API requests
- The extension needs to capture your auth token from network requests
- Refresh the page and wait for it to fully load before extracting

### Images not downloading in ZIP
- Make sure you have a stable internet connection
- Some images might be restricted by CORS policies
- Check Chrome's downloads settings

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Women Techmakers program for empowering women in technology
- All WTM Ambassadors around the world for their amazing work
- JSZip and SheetJS libraries for making data export easy

## ⚠️ Disclaimer

This extension is designed to help WTM Ambassadors export **their own** activity data from WTM Advocu for personal backup and record-keeping purposes. It only works on `wtm.advocu.com` and requires you to be logged into your own account.

This is not an official Women Techmakers or Google product.

---

**Made with ❤️ by a WTM Ambassador, for WTM Ambassadors**
