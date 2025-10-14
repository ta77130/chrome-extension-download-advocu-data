// Popup script for WTM Ambassador Activity Exporter
// Handles user interactions and data export

let extractedData = null;

// Utility: Escape HTML to prevent XSS
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Utility: Safely escape JSON for embedding in HTML
function escapeJSON(obj) {
  const jsonString = JSON.stringify(obj, null, 2);
  return jsonString
    .replace(/\\/g, '\\\\')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/'/g, '\\u0027')
    .replace(/"/g, '\\"');
}

// DOM elements
const extractButton = document.getElementById('extractData');
const downloadButtonsDiv = document.getElementById('downloadButtons');
const downloadJSONButton = document.getElementById('downloadJSON');
const downloadExcelButton = document.getElementById('downloadExcel');
const downloadZIPButton = document.getElementById('downloadZIP');
const clearDataButton = document.getElementById('clearData');
const statusDiv = document.getElementById('status');
const previewDiv = document.getElementById('dataPreview');
const previewContent = document.getElementById('previewContent');

// Show status message
function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.classList.remove('hidden');

  // Auto-hide success messages after 3 seconds
  if (type === 'success') {
    setTimeout(() => {
      statusDiv.classList.add('hidden');
    }, 3000);
  }
}

// Hide status message
function hideStatus() {
  statusDiv.classList.add('hidden');
}

// Show/hide download buttons
function setDownloadButtonsState(enabled) {
  if (enabled) {
    downloadButtonsDiv.classList.remove('hidden');
  } else {
    downloadButtonsDiv.classList.add('hidden');
  }
}

// Save extracted data to storage
async function saveDataToStorage(data) {
  return new Promise((resolve) => {
    chrome.storage.local.set({
      extractedData: data,
      extractedAt: new Date().toISOString()
    }, resolve);
  });
}

// Load extracted data from storage
async function loadDataFromStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['extractedData', 'extractedAt'], (result) => {
      if (chrome.runtime.lastError) {
        resolve(null);
        return;
      }
      resolve(result.extractedData || null);
    });
  });
}

// Clear cached data
async function clearCachedData() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['extractedData', 'extractedAt'], resolve);
  });
}

// Display data preview
function displayPreview(data) {
  if (!data) return;

  const summary = data.activitySummary;
  const activities = data.activities;

  let html = '<div class="preview-item">';
  html += '<span class="preview-label">Activity Summary:</span><br>';

  // Events
  if (summary.events && Object.keys(summary.events).length > 0) {
    html += `<strong>Events:</strong> `;
    const eventStats = [];
    if (summary.events.attendees) eventStats.push(`${summary.events.attendees.rawValue} Attendees`);
    if (summary.events.speakers) eventStats.push(`${summary.events.speakers.rawValue} Speakers`);
    if (summary.events.submitted) eventStats.push(`${summary.events.submitted.rawValue} Submitted`);
    html += eventStats.join(', ') + '<br>';
  }

  // Resources
  if (summary.resources && Object.keys(summary.resources).length > 0) {
    html += `<strong>Resources:</strong> `;
    const resourceStats = [];
    if (summary.resources.views) resourceStats.push(`${summary.resources.views.rawValue} Views`);
    if (summary.resources.submitted) resourceStats.push(`${summary.resources.submitted.rawValue} Submitted`);
    html += resourceStats.join(', ') + '<br>';
  }

  // Mentorship
  if (summary.mentorship && Object.keys(summary.mentorship).length > 0) {
    html += `<strong>Mentorship:</strong> `;
    const mentorshipStats = [];
    if (summary.mentorship.hours) mentorshipStats.push(`${summary.mentorship.hours.rawValue} Hours`);
    if (summary.mentorship.submitted) mentorshipStats.push(`${summary.mentorship.submitted.rawValue} Submitted`);
    html += mentorshipStats.join(', ') + '<br>';
  }

  // Speaking
  if (summary.speakingEngagements && Object.keys(summary.speakingEngagements).length > 0) {
    html += `<strong>Speaking:</strong> `;
    const speakingStats = [];
    if (summary.speakingEngagements.attendees) speakingStats.push(`${summary.speakingEngagements.attendees.rawValue} Attendees`);
    if (summary.speakingEngagements.minutes) speakingStats.push(`${summary.speakingEngagements.minutes.rawValue} Minutes`);
    if (summary.speakingEngagements.submitted) speakingStats.push(`${summary.speakingEngagements.submitted.rawValue} Submitted`);
    html += speakingStats.join(', ') + '<br>';
  }

  html += '</div>';

  html += '<div class="preview-item">';
  html += '<span class="preview-label">Detailed Activity Items Retrieved:</span><br>';
  html += `Events: ${activities.events.length} of ${summary.events.submitted?.value || 0}<br>`;
  html += `Resources: ${activities.resources.length} of ${summary.resources.submitted?.value || 0}<br>`;
  html += `Mentorship: ${activities.mentorship.length} of ${summary.mentorship.submitted?.value || 0}<br>`;
  html += `Speaking: ${activities.speaking.length} of ${summary.speakingEngagements.submitted?.value || 0}<br>`;
  html += '</div>';

  previewContent.innerHTML = html;
  previewDiv.classList.remove('hidden');
}

// Extract data from the current tab
async function extractData() {
  try {
    showStatus('Extracting data...', 'info');
    setDownloadButtonsState(false);
    previewDiv.classList.add('hidden');

    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Check if we're on the WTM Advocu page
    if (!tab.url.includes('wtm.advocu.com')) {
      showStatus('This extension only works on WTM Advocu (wtm.advocu.com). Please navigate to your WTM Ambassador profile page.', 'error');
      return;
    }

    // Send message to content script
    chrome.tabs.sendMessage(tab.id, { action: 'extractData' }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus('Error: Could not connect to the page. Please refresh and try again.', 'error');
        return;
      }

      if (response && response.success) {
        extractedData = response.data;

        // Save to storage for persistence
        saveDataToStorage(extractedData).then(() => {
          showStatus('Data extracted and saved successfully!', 'success');
          setDownloadButtonsState(true);
          displayPreview(extractedData);
        });
      } else {
        showStatus(`Error: ${response?.error || 'Unknown error'}`, 'error');
      }
    });

  } catch (error) {
    showStatus(`Error: ${error.message}`, 'error');
  }
}

// Download data as JSON
function downloadJSON() {
  if (!extractedData) {
    showStatus('No data to download. Please extract data first.', 'error');
    return;
  }

  const dataStr = JSON.stringify(extractedData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const filename = `advocu-data-${new Date().toISOString().split('T')[0]}.json`;

  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  }, () => {
    if (chrome.runtime.lastError) {
      showStatus('Error downloading file', 'error');
    } else {
      showStatus('JSON file downloaded successfully!', 'success');
    }
    URL.revokeObjectURL(url);
  });
}

// Helper function to create Excel workbook
function createExcelWorkbook(data) {
  const workbook = XLSX.utils.book_new();
  const summary = data.activitySummary;
  const activities = data.activities;

  // Sheet 1: Activity Summary
  const summaryData = [];
  summaryData.push(['Category', 'Metric', 'Value', 'Percentage']);

  // Events summary
  if (summary.events) {
    Object.entries(summary.events).forEach(([key, value]) => {
      summaryData.push(['Events', key, value.value || '', value.percentage || '']);
    });
  }

  // Resources summary
  if (summary.resources) {
    Object.entries(summary.resources).forEach(([key, value]) => {
      summaryData.push(['Resources', key, value.value || '', value.percentage || '']);
    });
  }

  // Mentorship summary
  if (summary.mentorship) {
    Object.entries(summary.mentorship).forEach(([key, value]) => {
      summaryData.push(['Mentorship', key, value.value || '', value.percentage || '']);
    });
  }

  // Speaking summary
  if (summary.speakingEngagements) {
    Object.entries(summary.speakingEngagements).forEach(([key, value]) => {
      summaryData.push(['Speaking Engagements', key, value.value || '', value.percentage || '']);
    });
  }

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Sheet 2: Events
  if (activities.events.length > 0) {
    const eventsData = [['Title', 'Description', 'Location', 'Date', 'Type', 'Attendees', 'Speakers', 'URL', 'ImageURL']];
    activities.events.forEach(event => {
      eventsData.push([
        event.title,
        event.description || '',
        event.location,
        event.date,
        event.type,
        event.attendees || '',
        event.speakers || '',
        event.url || '',
        event.imageUrl || ''
      ]);
    });
    const eventsSheet = XLSX.utils.aoa_to_sheet(eventsData);
    XLSX.utils.book_append_sheet(workbook, eventsSheet, 'Events');
  }

  // Sheet 3: Resources
  if (activities.resources.length > 0) {
    const resourcesData = [['Title', 'Description', 'Type', 'Date', 'Views', 'Topics', 'URL', 'ImageURL']];
    activities.resources.forEach(resource => {
      resourcesData.push([
        resource.title,
        resource.description || '',
        resource.type,
        resource.date,
        resource.views || '',
        resource.topics?.join('; ') || '',
        resource.url || '',
        resource.imageUrl || ''
      ]);
    });
    const resourcesSheet = XLSX.utils.aoa_to_sheet(resourcesData);
    XLSX.utils.book_append_sheet(workbook, resourcesSheet, 'Resources');
  }

  // Sheet 4: Mentorship
  if (activities.mentorship.length > 0) {
    const mentorshipData = [['Title', 'Description', 'Date', 'Hours', 'Topics', 'URL', 'ImageURL']];
    activities.mentorship.forEach(mentorship => {
      mentorshipData.push([
        mentorship.title,
        mentorship.description || '',
        mentorship.date,
        mentorship.hours || '',
        mentorship.topics?.join('; ') || '',
        mentorship.url || '',
        mentorship.imageUrl || ''
      ]);
    });
    const mentorshipSheet = XLSX.utils.aoa_to_sheet(mentorshipData);
    XLSX.utils.book_append_sheet(workbook, mentorshipSheet, 'Mentorship');
  }

  // Sheet 5: Speaking
  if (activities.speaking.length > 0) {
    const speakingData = [['Title', 'Description', 'Date', 'Minutes', 'Attendees', 'URL', 'ImageURL']];
    activities.speaking.forEach(speaking => {
      speakingData.push([
        speaking.title,
        speaking.description || '',
        speaking.date,
        speaking.minutes || '',
        speaking.attendees || '',
        speaking.url || '',
        speaking.imageUrl || ''
      ]);
    });
    const speakingSheet = XLSX.utils.aoa_to_sheet(speakingData);
    XLSX.utils.book_append_sheet(workbook, speakingSheet, 'Speaking Engagements');
  }

  return workbook;
}

// Download data as Excel
function downloadExcel() {
  if (!extractedData) {
    showStatus('No data to download. Please extract data first.', 'error');
    return;
  }

  try {
    const workbook = createExcelWorkbook(extractedData);

    // Generate Excel file
    const excelData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);

    const filename = `advocu-data-${new Date().toISOString().split('T')[0]}.xlsx`;

    chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: true
    }, () => {
      if (chrome.runtime.lastError) {
        showStatus('Error downloading file', 'error');
      } else {
        showStatus('Excel file downloaded successfully!', 'success');
      }
      URL.revokeObjectURL(url);
    });
  } catch (error) {
    showStatus(`Error creating Excel: ${error.message}`, 'error');
  }
}

// Generate HTML viewer for offline viewing
function generateHTMLViewer(data) {
  // Safely embed the data to prevent XSS
  const jsonData = escapeJSON(data);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WTM Ambassador Activity Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #202124; background: #f8f9fa; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    header { background: linear-gradient(135deg, #4285F4 0%, #34A853 100%); color: white; padding: 40px 20px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .profile-header { display: flex; align-items: center; gap: 30px; flex-wrap: wrap; }
    .profile-photo { width: 120px; height: 120px; border-radius: 50%; border: 4px solid white; object-fit: cover; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
    .profile-info h1 { font-size: 2.5em; margin-bottom: 10px; font-weight: 400; }
    .profile-meta { display: flex; gap: 20px; flex-wrap: wrap; margin-top: 10px; opacity: 0.95; }
    .meta-item { display: flex; align-items: center; gap: 5px; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .summary-card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #4285F4; }
    .summary-card h3 { color: #1a73e8; margin-bottom: 15px; font-size: 1.2em; font-weight: 500; }
    .stat { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
    .stat:last-child { border-bottom: none; }
    .stat-value { font-weight: 600; color: #34A853; }
    .bio-section { background: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .bio-section h2 { color: #1a73e8; margin-bottom: 15px; font-weight: 500; }
    .bio-section h3 { color: #5f6368; font-weight: 500; font-size: 1em; }
    .skills { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px; }
    .skill-tag { background: #e8f0fe; color: #1967d2; padding: 6px 14px; border-radius: 16px; font-size: 0.9em; font-weight: 500; }
    .tabs { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 30px; }
    .tab-buttons { display: flex; background: #f8f9fa; border-bottom: 1px solid #dadce0; overflow-x: auto; }
    .tab-button { padding: 16px 24px; border: none; background: none; cursor: pointer; font-size: 0.95em; font-weight: 500; color: #5f6368; transition: all 0.2s; white-space: nowrap; position: relative; }
    .tab-button:hover { background: #f1f3f4; color: #202124; }
    .tab-button.active { color: #1a73e8; background: white; }
    .tab-button.active::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: #1a73e8; }
    .tab-content { display: none; padding: 30px; }
    .tab-content.active { display: block; }
    .activities-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .activity-card { background: white; border: 1px solid #dadce0; border-radius: 8px; overflow: hidden; transition: all 0.2s; }
    .activity-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-color: #4285F4; }
    .activity-image { width: 100%; height: 200px; object-fit: cover; background: #f1f3f4; }
    .activity-content { padding: 20px; }
    .activity-title { font-size: 1.1em; font-weight: 500; margin-bottom: 10px; color: #202124; }
    .activity-details { font-size: 0.9em; color: #5f6368; margin-bottom: 8px; }
    .activity-link { color: #1a73e8; text-decoration: none; font-size: 0.9em; font-weight: 500; }
    .activity-link:hover { text-decoration: underline; }
    .social-links { display: flex; gap: 12px; margin-top: 15px; flex-wrap: wrap; }
    .social-link { color: white; text-decoration: none; padding: 8px 16px; background: rgba(255,255,255,0.2); border-radius: 20px; transition: all 0.2s; font-size: 0.9em; font-weight: 500; }
    .social-link:hover { background: rgba(255,255,255,0.35); transform: translateY(-1px); }
    footer { text-align: center; padding: 30px; color: #5f6368; font-size: 0.9em; }
    footer p { margin: 5px 0; }
    @media (max-width: 768px) {
      .profile-header { flex-direction: column; text-align: center; }
      .profile-info h1 { font-size: 1.8em; }
      .summary-grid, .activities-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="profile-header">
        <img id="profilePhoto" class="profile-photo" src="" alt="Profile Photo">
        <div class="profile-info">
          <h1 id="profileName">Loading...</h1>
          <div class="profile-meta">
            <div class="meta-item"><span>📍</span><span id="profileLocation"></span></div>
            <div class="meta-item"><span>💼</span><span id="profileJob"></span></div>
            <div class="meta-item"><span>📅</span><span id="profileSince"></span></div>
          </div>
          <div id="socialLinks" class="social-links"></div>
        </div>
      </div>
    </header>

    <div class="bio-section">
      <h2>About</h2>
      <p id="profileBio"></p>
      <div id="communitySection" style="margin-top: 20px;"></div>
      <h3 style="margin-top: 20px;">Applied Skills</h3>
      <div id="appliedSkills" class="skills"></div>
      <h3 style="margin-top: 20px;">Technical Skills</h3>
      <div id="technicalSkills" class="skills"></div>
      <div id="workshopsSection" style="margin-top: 20px;"></div>
    </div>

    <div class="summary-grid" id="summaryGrid"></div>

    <div class="tabs">
      <div class="tab-buttons">
        <button class="tab-button active" data-tab="events">Events</button>
        <button class="tab-button" data-tab="resources">Resources</button>
        <button class="tab-button" data-tab="mentorship">Mentorship</button>
        <button class="tab-button" data-tab="speaking">Speaking Engagements</button>
      </div>
      <div id="events" class="tab-content active"><div id="eventsGrid" class="activities-grid"></div></div>
      <div id="resources" class="tab-content"><div id="resourcesGrid" class="activities-grid"></div></div>
      <div id="mentorship" class="tab-content"><div id="mentorshipGrid" class="activities-grid"></div></div>
      <div id="speaking" class="tab-content"><div id="speakingGrid" class="activities-grid"></div></div>
    </div>

    <footer>
      <p>WTM Ambassador Activity Report</p>
      <p id="exportDate"></p>
      <p style="margin-top: 10px; font-size: 0.85em;">Generated with WTM Ambassador Activity Exporter</p>
    </footer>
  </div>

  <script>
    // Embedded data - no CORS issues!
    const DATA = ${jsonData};

    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        button.classList.add('active');
        document.getElementById(tabName).classList.add('active');
      });
    });

    function loadData() {
      try {
        displayProfile(DATA.profile);
        displaySummary(DATA.activitySummary);
        displayActivities(DATA.activities);
        document.getElementById('exportDate').textContent = 'Exported on ' + new Date(DATA.extractedAt).toLocaleDateString();
      } catch (error) {
        alert('Error loading data: ' + error.message);
      }
    }

    function displayProfile(profile) {
      if (!profile) return;
      if (profile.profilePhoto) document.getElementById('profilePhoto').src = profile.profilePhoto;
      document.getElementById('profileName').textContent = profile.name || 'WTM Ambassador';
      document.getElementById('profileLocation').textContent = profile.location || '';
      document.getElementById('profileJob').textContent = profile.jobTitle || '';
      document.getElementById('profileSince').textContent = 'Ambassador since ' + (profile.ambassadorSince || '');
      document.getElementById('profileBio').textContent = profile.biography || '';

      if (profile.community && profile.community.name) {
        document.getElementById('communitySection').innerHTML = '<h3>Community</h3><p><a href="' + profile.community.url + '" target="_blank" style="color: #667eea;">' + profile.community.name + '</a></p>';
      }

      if (profile.appliedSkills && profile.appliedSkills.length > 0) {
        document.getElementById('appliedSkills').innerHTML = profile.appliedSkills.map(s => '<span class="skill-tag">' + s + '</span>').join('');
      }

      if (profile.technicalSkills && profile.technicalSkills.length > 0) {
        document.getElementById('technicalSkills').innerHTML = profile.technicalSkills.map(s => '<span class="skill-tag">' + s + '</span>').join('');
      }

      if (profile.workshops && profile.workshops.length > 0) {
        document.getElementById('workshopsSection').innerHTML = '<h3>Workshops</h3><div class="skills">' + profile.workshops.map(w => '<span class="skill-tag">' + w + '</span>').join('') + '</div>';
      }

      const links = [];
      if (profile.socialLinks) {
        if (profile.socialLinks.linkedin) links.push('<a href="' + profile.socialLinks.linkedin + '" class="social-link" target="_blank">LinkedIn</a>');
        if (profile.socialLinks.github) links.push('<a href="' + profile.socialLinks.github + '" class="social-link" target="_blank">GitHub</a>');
        if (profile.socialLinks.twitter) links.push('<a href="' + profile.socialLinks.twitter + '" class="social-link" target="_blank">Twitter</a>');
        if (profile.socialLinks.website) links.push('<a href="' + profile.socialLinks.website + '" class="social-link" target="_blank">Website</a>');
      }
      document.getElementById('socialLinks').innerHTML = links.join('');
    }

    function displaySummary(summary) {
      const cards = [];
      if (summary.events) cards.push({ title: 'Events', stats: [
        { label: 'Submitted', value: summary.events.submitted?.rawValue || '0' },
        { label: 'Attendees', value: summary.events.attendees?.rawValue || '0' },
        { label: 'Speakers', value: summary.events.speakers?.rawValue || '0' }
      ]});
      if (summary.resources) cards.push({ title: 'Resources', stats: [
        { label: 'Submitted', value: summary.resources.submitted?.rawValue || '0' },
        { label: 'Views', value: summary.resources.views?.rawValue || '0' }
      ]});
      if (summary.mentorship) cards.push({ title: 'Mentorship', stats: [
        { label: 'Submitted', value: summary.mentorship.submitted?.rawValue || '0' },
        { label: 'Hours', value: summary.mentorship.hours?.rawValue || '0' }
      ]});
      if (summary.speakingEngagements) cards.push({ title: 'Speaking Engagements', stats: [
        { label: 'Submitted', value: summary.speakingEngagements.submitted?.rawValue || '0' },
        { label: 'Attendees', value: summary.speakingEngagements.attendees?.rawValue || '0' },
        { label: 'Minutes', value: summary.speakingEngagements.minutes?.rawValue || '0' }
      ]});

      document.getElementById('summaryGrid').innerHTML = cards.map(card =>
        '<div class="summary-card"><h3>' + card.title + '</h3>' +
        card.stats.map(stat => '<div class="stat"><span>' + stat.label + '</span><span class="stat-value">' + stat.value + '</span></div>').join('') +
        '</div>'
      ).join('');
    }

    function displayActivities(activities) {
      document.getElementById('eventsGrid').innerHTML = activities.events.map((e, i) =>
        '<div class="activity-card">' +
        (e.imageUrl ? '<img src="' + getImagePath(e.title, i) + '" onerror="this.src=\\'' + e.imageUrl + '\\'" class="activity-image" alt="' + e.title + '">' : '') +
        '<div class="activity-content"><div class="activity-title">' + e.title + '</div>' +
        (e.description ? '<div class="activity-details" style="color: #5f6368; margin-bottom: 12px;">' + e.description.substring(0, 150) + (e.description.length > 150 ? '...' : '') + '</div>' : '') +
        '<div class="activity-details">📍 ' + (e.location || 'N/A') + '</div>' +
        '<div class="activity-details">📅 ' + (e.date || 'N/A') + '</div>' +
        '<div class="activity-details">👥 ' + (e.attendees || 0) + ' Attendees</div>' +
        (e.url ? '<a href="' + e.url + '" class="activity-link" target="_blank">View Event →</a>' : '') +
        '</div></div>'
      ).join('') || '<p>No events found</p>';

      document.getElementById('resourcesGrid').innerHTML = activities.resources.map((r, i) =>
        '<div class="activity-card">' +
        (r.imageUrl ? '<img src="' + getImagePath(r.title, i) + '" onerror="this.src=\\'' + r.imageUrl + '\\'" class="activity-image" alt="' + r.title + '">' : '') +
        '<div class="activity-content"><div class="activity-title">' + r.title + '</div>' +
        (r.description ? '<div class="activity-details" style="color: #5f6368; margin-bottom: 12px;">' + r.description.substring(0, 150) + (r.description.length > 150 ? '...' : '') + '</div>' : '') +
        '<div class="activity-details">📝 ' + (r.type || 'N/A') + '</div>' +
        '<div class="activity-details">📅 ' + (r.date || 'N/A') + '</div>' +
        '<div class="activity-details">👁 ' + (r.views || 0) + ' Views</div>' +
        (r.url ? '<a href="' + r.url + '" class="activity-link" target="_blank">View Resource →</a>' : '') +
        '</div></div>'
      ).join('') || '<p>No resources found</p>';

      document.getElementById('mentorshipGrid').innerHTML = activities.mentorship.map((m, i) =>
        '<div class="activity-card">' +
        (m.imageUrl ? '<img src="' + getImagePath(m.title, i) + '" onerror="this.src=\\'' + m.imageUrl + '\\'" class="activity-image" alt="' + m.title + '">' : '') +
        '<div class="activity-content"><div class="activity-title">' + m.title + '</div>' +
        (m.description ? '<div class="activity-details" style="color: #5f6368; margin-bottom: 12px;">' + m.description.substring(0, 150) + (m.description.length > 150 ? '...' : '') + '</div>' : '') +
        '<div class="activity-details">📅 ' + (m.date || 'N/A') + '</div>' +
        '<div class="activity-details">⏱ ' + (m.hours || 0) + ' Hours</div>' +
        (m.url ? '<a href="' + m.url + '" class="activity-link" target="_blank">Learn More →</a>' : '') +
        '</div></div>'
      ).join('') || '<p>No mentorship sessions found</p>';

      document.getElementById('speakingGrid').innerHTML = activities.speaking.map((s, i) =>
        '<div class="activity-card">' +
        (s.imageUrl ? '<img src="' + getImagePath(s.title, i) + '" onerror="this.src=\\'' + s.imageUrl + '\\'" class="activity-image" alt="' + s.title + '">' : '') +
        '<div class="activity-content"><div class="activity-title">' + s.title + '</div>' +
        (s.description ? '<div class="activity-details" style="color: #5f6368; margin-bottom: 12px;">' + s.description.substring(0, 150) + (s.description.length > 150 ? '...' : '') + '</div>' : '') +
        '<div class="activity-details">📅 ' + (s.date || 'N/A') + '</div>' +
        '<div class="activity-details">⏱ ' + (s.minutes || 0) + ' Minutes</div>' +
        '<div class="activity-details">👥 ' + (s.attendees || 0) + ' Attendees</div>' +
        (s.url ? '<a href="' + s.url + '" class="activity-link" target="_blank">View Talk →</a>' : '') +
        '</div></div>'
      ).join('') || '<p>No speaking engagements found</p>';
    }

    function getImagePath(title, index) {
      const safeTitle = title.substring(0, 50).replace(/[^a-z0-9]/gi, '_').toLowerCase();
      return 'images/' + safeTitle + '_' + (index + 1) + '.jpg';
    }

    loadData();
  </script>
</body>
</html>`;
}

// Download complete backup as ZIP with images
async function downloadZIP() {
  if (!extractedData) {
    showStatus('No data to download. Please extract data first.', 'error');
    return;
  }

  try {
    showStatus('Preparing ZIP file with images...', 'info');

    const zip = new JSZip();
    const dateStr = new Date().toISOString().split('T')[0];

    // Add JSON data
    const jsonStr = JSON.stringify(extractedData, null, 2);
    zip.file(`advocu-data-${dateStr}.json`, jsonStr);

    // Add Excel data
    const workbook = createExcelWorkbook(extractedData);
    const excelData = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    zip.file(`advocu-data-${dateStr}.xlsx`, excelData);

    // Add HTML viewer with embedded data (no CORS issues!)
    const htmlViewer = generateHTMLViewer(extractedData);
    zip.file('index.html', htmlViewer);

    // Create README
    const readme = `# WTM Ambassador Activity Export

Exported on: ${new Date().toISOString()}
Ambassador: ${extractedData.profile?.name || 'N/A'}
User ID: ${extractedData.userId}

## Quick Start

**Open index.html in your web browser** to view your activity report with a beautiful visual interface!

## Contents

- **index.html** - Visual HTML report (open this in your browser!)
- **advocu-data-${dateStr}.json** - Complete data in JSON format
- **advocu-data-${dateStr}.xlsx** - Activity data in Excel format (multiple sheets)
- **images/** - All activity images downloaded from WTM Advocu

## Summary

- Events: ${extractedData.activitySummary.events.submitted?.value || 0}
- Resources: ${extractedData.activitySummary.resources.submitted?.value || 0}
- Mentorship: ${extractedData.activitySummary.mentorship.submitted?.value || 0}
- Speaking Engagements: ${extractedData.activitySummary.speakingEngagements.submitted?.value || 0}

## Profile Information

- Name: ${extractedData.profile?.name || 'N/A'}
- Location: ${extractedData.profile?.location || 'N/A'}
- Job Title: ${extractedData.profile?.jobTitle || 'N/A'}
- Ambassador Since: ${extractedData.profile?.ambassadorSince || 'N/A'}

This is a complete offline backup of your WTM Ambassador activity data.

## Excel File Structure

The Excel file contains 5 sheets:
1. Summary - Activity statistics
2. Events - Detailed events data
3. Resources - Resources/blog posts data
4. Mentorship - Mentorship sessions data
5. Speaking Engagements - Speaking engagements data

## Viewing Your Data

1. **Visual Report**: Open index.html in any web browser for a beautiful, interactive view
2. **Excel**: Open the .xlsx file in Excel, Google Sheets, or LibreOffice
3. **JSON**: For developers - import into your own tools or applications
`;
    zip.file('README.md', readme);

    // Collect all image URLs from activities
    const imageUrls = new Map(); // Map<imageUrl, activityTitle>

    // Collect from events
    extractedData.activities.events.forEach(event => {
      if (event.imageUrl) {
        imageUrls.set(event.imageUrl, event.title);
      }
    });

    // Collect from resources
    extractedData.activities.resources.forEach(resource => {
      if (resource.imageUrl) {
        imageUrls.set(resource.imageUrl, resource.title);
      }
    });

    // Collect from mentorship
    extractedData.activities.mentorship.forEach(mentorship => {
      if (mentorship.imageUrl) {
        imageUrls.set(mentorship.imageUrl, mentorship.title);
      }
    });

    // Collect from speaking
    extractedData.activities.speaking.forEach(speaking => {
      if (speaking.imageUrl) {
        imageUrls.set(speaking.imageUrl, speaking.title);
      }
    });

    // Download and add images to ZIP
    const imagesFolder = zip.folder('images');
    const totalImages = imageUrls.size;
    let successCount = 0;

    if (totalImages > 0) {
      showStatus(`Downloading ${totalImages} images...`, 'info');

      const imagePromises = Array.from(imageUrls.entries()).map(async ([url, title], index) => {
        try {
          const response = await fetch(url);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const blob = await response.blob();

          // Determine the correct file extension
          let extension = 'jpg'; // Default fallback

          if (blob.type) {
            const mimeType = blob.type.toLowerCase();
            const typePart = mimeType.split('/')[1];

            // Map common image MIME types to extensions
            if (typePart === 'jpeg' || mimeType === 'image/jpeg') {
              extension = 'jpg';
            } else if (typePart === 'png' || mimeType === 'image/png') {
              extension = 'png';
            } else if (typePart === 'gif' || mimeType === 'image/gif') {
              extension = 'gif';
            } else if (typePart === 'webp' || mimeType === 'image/webp') {
              extension = 'webp';
            } else if (typePart === 'svg+xml' || mimeType === 'image/svg+xml') {
              extension = 'svg';
            } else if (mimeType.startsWith('image/') && typePart && typePart !== 'octet-stream') {
              // Use the type part if it's an image and not octet-stream
              extension = typePart;
            }
            // If it's application/octet-stream or unknown, keep default 'jpg'
          }

          // Create a safe filename from the activity title
          const safeTitle = title.substring(0, 50).replace(/[^a-z0-9]/gi, '_').toLowerCase();
          const filename = `${safeTitle}_${index + 1}.${extension}`;
          imagesFolder.file(filename, blob);

          successCount++;
          showStatus(`Downloaded ${successCount} of ${totalImages} images...`, 'info');
          return { success: true, url };
        } catch (error) {
          return { success: false, url, error: error.message };
        }
      });

      await Promise.all(imagePromises);
    }

    // Generate ZIP file
    showStatus('Creating ZIP file...', 'info');
    const content = await zip.generateAsync({ type: 'blob' });

    // Download ZIP
    const url = URL.createObjectURL(content);
    const filename = `advocu-complete-backup-${dateStr}.zip`;

    chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: true
    }, () => {
      if (chrome.runtime.lastError) {
        showStatus('Error downloading ZIP file', 'error');
      } else {
        const imageMessage = successCount > 0 ? ` (${successCount} images included)` : ' (no images)';
        showStatus(`Complete backup downloaded!${imageMessage}`, 'success');
      }
      URL.revokeObjectURL(url);
    });

  } catch (error) {
    showStatus(`Error creating ZIP: ${error.message}`, 'error');
  }
}

// Clear cached data function
function clearData() {
  if (confirm('Are you sure you want to clear the cached data? You will need to extract it again.')) {
    clearCachedData().then(() => {
      extractedData = null;
      setDownloadButtonsState(false);
      previewDiv.classList.add('hidden');
      extractButton.textContent = 'Extract Data';
      showStatus('Cached data cleared', 'success');
    });
  }
}

// Initialize popup - load cached data if available
async function initializePopup() {
  hideStatus();
  setDownloadButtonsState(false);

  // Try to load cached data
  const cachedData = await loadDataFromStorage();

  if (cachedData) {
    extractedData = cachedData;
    setDownloadButtonsState(true);
    displayPreview(extractedData);

    // Change button text to "Refresh Data"
    extractButton.textContent = 'Refresh Data';

    // Get the extraction timestamp
    chrome.storage.local.get(['extractedAt'], (result) => {
      if (result.extractedAt) {
        const extractedDate = new Date(result.extractedAt);
        const timeAgo = getTimeAgo(extractedDate);
        showStatus(`Using cached data from ${timeAgo}`, 'info');
      }
    });
  } else {
    // No cache, use default text
    extractButton.textContent = 'Extract Data';
  }
}

// Helper function to format "time ago"
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

// Event listeners
extractButton.addEventListener('click', extractData);
downloadJSONButton.addEventListener('click', downloadJSON);
downloadExcelButton.addEventListener('click', downloadExcel);
downloadZIPButton.addEventListener('click', downloadZIP);
clearDataButton.addEventListener('click', clearData);

// Initialize when popup opens
initializePopup();
