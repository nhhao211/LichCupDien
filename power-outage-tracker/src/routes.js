const express = require('express');
const router = express.Router();
const { getPowerOutages, getDistricts, fetchPowerOutageData } = require('./services/powerOutage');
const moment = require('moment');

// Home page route
router.get('/', async (req, res) => {
  try {
    const districts = await getDistricts();
    const selectedDistrict = req.query.district || null;
    const selectedDate = req.query.date || moment().format('YYYY-MM-DD');

    // Directly fetch from API when a district is selected
    if (selectedDistrict) {
      // Convert selected date to API format and calculate end date (7 days from selected date)
      const startDate = moment(selectedDate).format('DD-MM-YYYY');
      const endDate = moment(selectedDate).add(7, 'days').format('DD-MM-YYYY');
      
      console.log(`Fetching outages from ${startDate} to ${endDate}`);
      
      // Fetch fresh data from API
      const outages = await fetchPowerOutageData(selectedDistrict, startDate, endDate);
      
      // Find the district name
      const district = districts.find(d => d.code === selectedDistrict);
      
      // Format the outages for display
      const formattedOutages = outages.map(outage => ({
        district_code: selectedDistrict,
        district_name: district ? district.name : '',
        outage_date: moment(outage.startTime, 'DD/MM/YYYY HH:mm:ss').format('DD/MM/YYYY'),
        start_time: moment(outage.startTime, 'DD/MM/YYYY HH:mm:ss').format('HH:mm'),
        end_time: moment(outage.endTime, 'DD/MM/YYYY HH:mm:ss').format('HH:mm'),
        full_start_time: outage.startTime,
        full_end_time: outage.endTime,
        affected_area: outage.affectedArea,
        reason: outage.reason
      }));

      // Sort outages by date and time
      formattedOutages.sort((a, b) => {
        const dateA = moment(a.full_start_time, 'DD/MM/YYYY HH:mm:ss');
        const dateB = moment(b.full_start_time, 'DD/MM/YYYY HH:mm:ss');
        return dateA - dateB;
      });

      res.render('index', {
        districts,
        selectedDistrict,
        selectedDate,
        outages: formattedOutages,
        moment,
        startDate: moment(selectedDate).format('DD/MM/YYYY'),
        endDate: moment(selectedDate).add(7, 'days').format('DD/MM/YYYY')
      });
    } else {
      // If no district selected, show empty results
      res.render('index', {
        districts,
        selectedDistrict,
        selectedDate,
        outages: [],
        moment,
        startDate: moment(selectedDate).format('DD/MM/YYYY'),
        endDate: moment(selectedDate).add(7, 'days').format('DD/MM/YYYY')
      });
    }
  } catch (error) {
    console.error('Error in home route:', error);
    res.status(500).render('error', { 
      message: 'Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.'
    });
  }
});

// API route to get power outages
router.get('/api/outages', async (req, res) => {
  try {
    const { district, date } = req.query;
    if (!district || !date) {
      return res.json([]);
    }

    const startDate = moment(date).format('DD-MM-YYYY');
    const endDate = moment(date).add(7, 'days').format('DD-MM-YYYY');
    const outages = await fetchPowerOutageData(district, startDate, endDate);
    res.json(outages);
  } catch (error) {
    console.error('Error in API route:', error);
    res.status(500).json({ 
      error: 'Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.'
    });
  }
});

module.exports = router;
