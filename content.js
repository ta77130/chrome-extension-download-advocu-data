// Content script for extracting data from Advocu via API
// This script fetches activity data directly from the Advocu API

// Function to extract user ID from URL
function getUserIdFromUrl() {
  const match = window.location.pathname.match(/\/ambassadors\/([a-f0-9]+)/);
  return match ? match[1] : null;
}

// Function to extract profile information from the page
function extractProfileInfo() {
  const profile = {
    name: null,
    email: null,
    location: null,
    ambassadorSince: null,
    profilePhoto: null,
    biography: null,
    jobTitle: null,
    community: {
      name: null,
      url: null
    },
    appliedSkills: [],
    technicalSkills: [],
    workshops: [],
    socialLinks: {}
  };

  try {
    // Extract name
    const nameElement = document.querySelector('aside h2');
    if (nameElement) profile.name = nameElement.textContent.trim();

    // Extract email
    const emailElement = document.querySelector('aside p');
    if (emailElement) profile.email = emailElement.textContent.trim();

    // Extract location
    const locationElements = document.querySelectorAll('aside .grid dl');
    locationElements.forEach(dl => {
      const dt = dl.querySelector('dt');
      const dd = dl.querySelector('dd');
      if (dt && dd) {
        if (dt.textContent.includes('Location')) {
          profile.location = dd.textContent.trim();
        } else if (dt.textContent.includes('Ambassador Since')) {
          profile.ambassadorSince = dd.textContent.trim();
        }
      }
    });

    // Extract profile photo
    const avatarImg = document.querySelector('advocu-avatar img');
    if (avatarImg) profile.profilePhoto = avatarImg.src;

    // Extract biography
    const bioElements = document.querySelectorAll('aside .ambassador-details');
    bioElements.forEach(section => {
      const heading = section.querySelector('h4');
      if (heading) {
        const headingText = heading.textContent.trim();

        if (headingText === 'Biography') {
          const bioP = section.querySelector('p');
          if (bioP) profile.biography = bioP.textContent.trim();
        } else if (headingText === 'Job Title') {
          const jobP = section.querySelector('p');
          if (jobP) profile.jobTitle = jobP.textContent.trim();
        } else if (headingText === 'Community') {
          const communityLink = section.querySelector('a');
          if (communityLink) {
            profile.community.name = communityLink.textContent.trim();
            profile.community.url = communityLink.href;
          }
        } else if (headingText === 'Applied Skills') {
          const skillSpans = section.querySelectorAll('.applied-badge');
          profile.appliedSkills = Array.from(skillSpans).map(span => span.textContent.trim());
        } else if (headingText === 'Technical Skills') {
          const skillSpans = section.querySelectorAll('.technical-badge');
          profile.technicalSkills = Array.from(skillSpans).map(span => span.textContent.trim());
        } else if (headingText === 'Workshops') {
          const workshopSpans = section.querySelectorAll('.workshop-badge');
          profile.workshops = Array.from(workshopSpans).map(span => span.textContent.trim());
        }
      }
    });

    // Extract social links
    const socialLinks = document.querySelectorAll('advocu-social-link a');
    socialLinks.forEach(link => {
      const href = link.href;
      if (href.includes('facebook.com')) {
        profile.socialLinks.facebook = href;
      } else if (href.includes('github.com')) {
        profile.socialLinks.github = href;
      } else if (href.includes('linkedin.com')) {
        profile.socialLinks.linkedin = href;
      } else if (href.includes('stackoverflow.com')) {
        profile.socialLinks.stackoverflow = href;
      } else if (href.includes('twitter.com') || href.includes('x.com')) {
        profile.socialLinks.twitter = href;
      } else {
        // Generic website
        profile.socialLinks.website = href;
      }
    });

  } catch (error) {
    console.error('Error extracting profile info:', error);
  }

  return profile;
}

// Function to get auth token from chrome storage
async function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['advocuAuthToken', 'tokenCapturedAt'], (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (result.advocuAuthToken) {
        resolve(result.advocuAuthToken);
      } else {
        reject(new Error('Authentication token not found. Please navigate around the page (scroll, click tabs) to allow the extension to capture your token, then try again.'));
      }
    });
  });
}

// Function to fetch summary data from API
async function fetchSummaryFromAPI(userId, token) {
  const apiUrl = `https://api-wtm.advocu.com/activities/summary/${userId}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'authorization': `Bearer ${token}`,
        'cache-control': 'no-cache',
        'pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching summary from API:', error);
    throw error;
  }
}

// Function to fetch activities from API
async function fetchActivitiesFromAPI(userId, token) {
  const apiUrl = `https://api-wtm.advocu.com/activities/${userId}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'authorization': `Bearer ${token}`,
        'cache-control': 'no-cache',
        'pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching activities from API:', error);
    throw error;
  }
}

// Helper function to format large numbers (e.g., 2258 -> "2.3k")
function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return String(num);
}

// Function to transform summary API response
function transformSummaryData(summaryData) {
  const summary = {
    events: {},
    resources: {},
    mentorship: {},
    speakingEngagements: {}
  };

  if (!summaryData) return summary;

  // Events (communityActivities)
  if (summaryData.communityActivities) {
    const events = summaryData.communityActivities.summary;
    summary.events = {
      attendees: {
        value: events.attendees?.totalParticipants || 0,
        rawValue: formatNumber(events.attendees?.totalParticipants || 0),
        percentage: events.attendees?.diversityPercentage || null
      },
      speakers: {
        value: events.speakers?.totalParticipants || 0,
        rawValue: String(events.speakers?.totalParticipants || 0),
        percentage: events.speakers?.diversityPercentage || null
      },
      submitted: {
        value: events.submittedActivities || 0,
        rawValue: String(events.submittedActivities || 0),
        percentage: null
      }
    };
  }

  // Resources (resourcesActivities)
  if (summaryData.resourcesActivities) {
    const resources = summaryData.resourcesActivities.summary;
    summary.resources = {
      views: {
        value: resources.viewsCount || 0,
        rawValue: String(resources.viewsCount || 0),
        percentage: null
      },
      submitted: {
        value: resources.submittedActivities || 0,
        rawValue: String(resources.submittedActivities || 0),
        percentage: null
      }
    };
  }

  // Mentorship (mentorshipActivities)
  if (summaryData.mentorshipActivities) {
    const mentorship = summaryData.mentorshipActivities.summary;
    const hours = Math.round((mentorship.lengthInMinutesTotal || 0) / 60);
    summary.mentorship = {
      hours: {
        value: hours,
        rawValue: String(hours),
        percentage: null
      },
      submitted: {
        value: mentorship.submittedActivities || 0,
        rawValue: String(mentorship.submittedActivities || 0),
        percentage: null
      }
    };
  }

  // Speaking engagements (visibilityActivities)
  if (summaryData.visibilityActivities) {
    const speaking = summaryData.visibilityActivities.summary;
    summary.speakingEngagements = {
      attendees: {
        value: speaking.attendees?.totalParticipants || 0,
        rawValue: formatNumber(speaking.attendees?.totalParticipants || 0),
        percentage: speaking.attendees?.diversityPercentage || null
      },
      minutes: {
        value: speaking.talkLengthTotal || 0,
        rawValue: String(speaking.talkLengthTotal || 0),
        percentage: null
      },
      submitted: {
        value: speaking.submittedActivities || 0,
        rawValue: String(speaking.submittedActivities || 0),
        percentage: null
      }
    };
  }

  return summary;
}

// Function to transform activities list
function transformActivitiesData(activitiesArray) {
  const activities = {
    events: [],
    resources: [],
    mentorship: [],
    speaking: []
  };

  if (!activitiesArray || !Array.isArray(activitiesArray)) {
    return activities;
  }

  activitiesArray.forEach(activity => {
    const activityType = activity.type;

    if (activityType === 'COMMUNITY') {
      // This is an event
      // Format location properly, handling null/undefined city
      const city = activity.eventCity;
      const country = activity.eventCountry;
      let location = '';
      if (city && city !== 'null') {
        location = country ? `${city}, ${country}` : city;
      } else {
        location = country || '';
      }

      activities.events.push({
        title: activity.title,
        description: activity.description || '',
        location: location,
        date: activity.eventDateRange?.start,
        type: activity.eventOrganizationType,
        attendees: activity.attendees?.totalParticipants,
        speakers: activity.speakers?.totalParticipants,
        url: activity.eventUrl || (activity.urls && activity.urls[0]),
        imageUrl: activity.imageUrl
      });
    } else if (activityType === 'VISIBILITY') {
      // This is a speaking engagement
      activities.speaking.push({
        title: activity.title,
        description: activity.description || '',
        date: activity.dateOfSpeaking,
        minutes: activity.talkLength,
        attendees: activity.attendees?.totalParticipants,
        url: (activity.urls && activity.urls[0]) || '',
        imageUrl: activity.imageUrl
      });
    } else if (activityType === 'RESOURCES') {
      // This is a resource
      activities.resources.push({
        title: activity.title,
        description: activity.description || '',
        type: (activity.resourceTypes && activity.resourceTypes[0]) || 'Blog',
        date: activity.publicationDate || activity.dateSubmitted,
        views: activity.viewsCount,
        topics: activity.tags || [],
        url: activity.projectUrl || '',
        imageUrl: activity.imageUrl
      });
    } else if (activityType === 'MENTORSHIP') {
      // This is mentorship
      activities.mentorship.push({
        title: activity.title,
        description: activity.description || '',
        date: activity.mentorshipDateRange?.start || activity.dateSubmitted,
        hours: activity.mentorshipLengthInMinutes ? Math.round(activity.mentorshipLengthInMinutes / 60) : null,
        topics: activity.tags || [],
        url: (activity.urls && activity.urls[0]) || '',
        imageUrl: activity.imageUrl
      });
    }
  });

  return activities;
}

// Main extraction function using API
async function extractAllData() {
  try {
    // Get user ID from URL
    const userId = getUserIdFromUrl();
    if (!userId) {
      throw new Error('Could not extract user ID from URL. Make sure you are on your profile page.');
    }

    // Get auth token
    const token = await getAuthToken();

    // Fetch both summary and activities data in parallel
    const [summaryData, activitiesData] = await Promise.all([
      fetchSummaryFromAPI(userId, token),
      fetchActivitiesFromAPI(userId, token)
    ]);

    // Transform the data
    const activitySummary = transformSummaryData(summaryData);
    const activities = transformActivitiesData(activitiesData);

    // Extract profile information
    const profileInfo = extractProfileInfo();

    // Add metadata
    return {
      extractedAt: new Date().toISOString(),
      url: window.location.href,
      userId: userId,
      profile: profileInfo,
      activitySummary: activitySummary,
      activities: activities,
      rawAPIData: {
        summary: summaryData,
        activities: activitiesData
      }
    };

  } catch (error) {
    console.error('Error in extractAllData:', error);
    throw error;
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'extractData') {
    extractAllData()
      .then(data => {
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { extractAllData, getUserIdFromUrl, getAuthToken };
}
