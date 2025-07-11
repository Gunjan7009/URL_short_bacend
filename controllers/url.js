const shortid = require("shortid");
const URL =require('../MODELS/url');
const isValidUrl = require('valid-url');

async function handleUrl(req, res) {
    const { url, remarks, expiresAt, enableExpiration } = req.body; // `expiresIn` is in days, optional
    const userId = req.user.id;
    if (!url || !isValidUrl.isUri(url)) {
        return res.status(400).json({ error: "Valid URL is required" });
    }

    const shortingId = shortid.generate();
    const baseUrl = 'http://localhost:8005/';

    let expirationDate = null;
    if (enableExpiration && expiresAt) {
        expirationDate = new Date(expiresAt);
        if (isNaN(expirationDate.getTime())) {
            return res.status(400).json({ error: "Invalid expiration date format" });
        }
    }

    const userIp = req.ip; // Get the user's IP address
    const userDevice = req.device?.type || "unknown"; // Get the device type (mobile, tablet, desktop)

    try {
      const newUrl =   await URL.create({
            userId: userId,
            shortId: shortingId,
            redirectURL: url,
            expiresAt: expirationDate,
            remarks: remarks,
            shortUrl: `${baseUrl}r/${shortingId}`,
            visithistory: [
                {
                    timestamp: Date.now(),
                    ipAddress: userIp,
                    userAgent: req.headers["user-agent"], // Store device type during URL creation
                    deviceType: userDevice, // Store device type during URL creation
                },
            ],
        });

        // return res.json({ id: shortingId });
        return  res.json({ shortUrl: `${baseUrl}r/${shortingId}`, newUrl });
    } catch (err) {
        console.error("Error creating URL entry:", err);
        return res.status(500).json({ error: "Internal error" });
    }
}

const editUrl = async (req, res) => {
  const { shortId } = req.params;
  const { url, remarks, expiresAt, enableExpiration } = req.body;

  try {
      const updatedFields = {};
      if (url) updatedFields.redirectURL = url;
      if (remarks) updatedFields.remarks = remarks;
      if (enableExpiration) {
        if (expiresAt) {
            const expirationDate = new Date(expiresAt);
            if (isNaN(expirationDate.getTime())) {
                return res.status(400).json({ error: "Invalid expiration date format" });
            }
            updatedFields.expiresAt = expirationDate;
        }
    } else {
        updatedFields.expiresAt = null;
    }
      console.log("Updated Fields:", updatedFields);

      const updatedUrl = await URL.findOneAndUpdate(
          { shortId, userId: req.user.id }, // Ensure user can only edit their own URLs
          { $set: updatedFields },
          { new: true }
      );

      if (!updatedUrl) {
          return res.status(404).json({ error: "URL not found" });
      }

      res.json({ message: "URL updated successfully", updatedUrl });
  } catch (err) {
      console.error("Error updating URL:", err);
      res.status(500).json({ error: "Internal server error" });
  }
};

const deleteUrl = async (req, res) => {
  const { shortId } = req.params;

  try {
    console.log("Deleting URL:", shortId);
      const deletedUrl = await URL.findOneAndDelete({ shortId, userId: req.user.id });

      if (!deletedUrl) {
          return res.status(404).json({ error: "URL not found or unauthorized" });
      }

      res.json({ message: "URL deleted successfully" });
  } catch (err) {
      console.error("Error deleting URL:", err);
      res.status(500).json({ error: "Internal server error" });
  }
};




async function getCountOfUrls(req, res) {
    try {
        const count = await URL.countDocuments({ userId: req.user.id });
        return res.json({ count });
    } catch (err) {
        console.error("Error getting URL count:", err);
        return res.status(500).json({ error: "Internal error" });
    }
}

const getAnalytics = async (req, res) => {
    const shortId = req.params.shortId;

    try {
      const url = await URL.findOne({ shortId, userId: req.user.id });
  
      if (!url) {
        return res.status(404).json({ error: "URL not found" });
      }
  
      // Summarize analytics data
      const totalClicks = url.visithistory.length;
      
      const deviceStats = url.visithistory.reduce((stats, visit) => {
        const device = visit.deviceType || "unknown";
        stats[device] = (stats[device] || 0) + 1;
        return stats;
      }, {});
  
   // Aggregate by browser
   const browserStats = url.visithistory.reduce((stats, visit) => {
      const agent = useragent.parse(visit.userAgent);
      const browser = agent.family || 'unknown';
      stats[browser] = (stats[browser] || 0) + 1;
      return stats;
    }, {});
  
    // Aggregate by operating system
    const osStats = url.visithistory.reduce((stats, visit) => {
      const agent = useragent.parse(visit.userAgent);
      const os = agent.os.family || 'unknown';
      stats[os] = (stats[os] || 0) + 1;
      return stats;
    }, {});
  
    res.json({
      shortId,
      totalClicks,
      deviceStats,
      browserStats,
      osStats,
    });
    } catch (err) {
      res.status(500).json({ error: "Internal server error" });
    }
  };

const useragent = require('useragent'); // To parse user-agent details

const redirectToOriginalUrl = async (req, res) => {
  const { shortId } = req.params;

  try {
    const url = await URL.findOne({ shortId });

    if (!url) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    // Record click data
    const userAgent = req.headers['user-agent'];
    const agent = useragent.parse(userAgent); // Parse user-agent to get browser/OS
    const deviceType = req.device.type; // Device type
    // const ipAddress = req.ip; // Client IP
    // const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    // const userAgent = req.headers['user-agent'] || 'unknown';
    // const agent = useragent.parse(userAgent); // Parse user-agent to get browser/OS
    const ipAddress = req.headers['x-forwarded-for'] || req.ip === '::1' ? '127.0.0.1' : req.ip;

    // const deviceType = agent.device.family === 'Other' ? 'unknown' : agent.device.family;

    url.visithistory.push({
      timestamp: new Date(),
      ipAddress,
      userAgent,
      deviceType: deviceType || 'unknown',
    });

    await url.save(); // Save click data to the database

    // Redirect to the original URL
    return res.redirect(url.redirectURL);
  } catch (err) {
    console.error('Error during redirection:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


const getAggregatedAnalytics = async (req, res) => {
  try {
      const userId = req.user.id;
      const urls = await URL.find({ userId });

      if (!urls.length) {
          return res.json({ totalClicks: 0, datewiseClicks: {}, deviceStats: {} });
      }

      let datewiseClicks = {};
      let deviceStats = {};

      urls.forEach(url => {
          url.visithistory.forEach(visit => {
              // Process date-wise clicks
              const date = new Date(visit.timestamp).toISOString().split('T')[0]; // Format as YYYY-MM-DD
              datewiseClicks[date] = (datewiseClicks[date] || 0) + 1;

              // Process device-wise clicks
              const device = visit.deviceType || "unknown";
              deviceStats[device] = (deviceStats[device] || 0) + 1;
          });
      });

      res.json({
          totalClicks: Object.values(datewiseClicks).reduce((a, b) => a + b, 0),
          datewiseClicks,
          deviceStats,
          urls
      });

  } catch (err) {
      console.error("Error fetching aggregated analytics:", err);
      res.status(500).json({ error: "Internal server error" });
  }
};



module.exports = { handleUrl, getCountOfUrls, editUrl, deleteUrl, getAnalytics, redirectToOriginalUrl, getAggregatedAnalytics };