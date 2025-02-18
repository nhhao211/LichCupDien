const moment = require('moment');
const { JSDOM } = require('jsdom');
const { db } = require('../database');
const https = require('https');

async function fetchPowerOutageData(districtCode, startDate, endDate) {
  try {
    console.log(`Fetching data for district ${districtCode} from ${startDate} to ${endDate}`);
    
    const url = new URL('https://cskh.evnspc.vn/TraCuu/GetThongTinLichNgungGiamMaKhachHang');
    url.searchParams.append('madvi', districtCode);
    url.searchParams.append('tuNgay', startDate);
    url.searchParams.append('denNgay', endDate);
    url.searchParams.append('ChucNang', 'MaDonVi');

    console.log('Request URL:', url.toString());

    // Store cookies between requests
    let cookies = [];

    const html = await new Promise((resolve, reject) => {
      const makeRequest = (requestUrl, followRedirect = true) => {
        const options = {
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Cookie': cookies.join('; ') // Include cookies in subsequent requests
          },
          timeout: 10000,
          rejectUnauthorized: false
        };

        const req = https.get(requestUrl, options, (res) => {
          console.log('Response status:', res.statusCode);
          
          // Store new cookies
          const newCookies = res.headers['set-cookie'];
          if (newCookies) {
            cookies = cookies.concat(newCookies.map(cookie => cookie.split(';')[0]));
          }

          if ((res.statusCode === 301 || res.statusCode === 302) && followRedirect) {
            const redirectUrl = new URL(res.headers.location, requestUrl);
            console.log('Following redirect to:', redirectUrl.toString());
            
            // Make a new request to the redirect URL
            makeRequest(redirectUrl.toString(), false);
            return;
          }

          let data = '';
          res.on('data', chunk => { 
            data += chunk;
          });
          res.on('end', () => {
            if (data.includes('search-result')) {
              console.log('Received valid response with search results');
              resolve(data);
            } else if (followRedirect) {
              // If we haven't followed a redirect yet, try the same URL again
              console.log('No search results found, retrying request...');
              makeRequest(requestUrl, false);
            } else {
              console.log('No valid response after retry');
              resolve(data);
            }
          });
        });

        req.on('error', (error) => {
          console.error('Request error:', error);
          reject(error);
        });
        req.end();
      };

      makeRequest(url.toString());
    });

    console.log('Response received, parsing HTML...');
    
    // Parse HTML response
    const dom = new JSDOM(html);
    const rows = dom.window.document.querySelectorAll('.search-result table tbody tr');
    
    console.log(`Found ${rows.length} rows in the response`);
    
    const outages = Array.from(rows).map(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 4) return null;

      // Create a temporary div to decode HTML entities
      const div = dom.window.document.createElement('div');
      
      div.innerHTML = cells[2].innerHTML;
      const affectedArea = div.textContent;
      
      div.innerHTML = cells[3].innerHTML;
      const reason = div.textContent;

      return {
        startTime: cells[0].textContent.trim(),
        endTime: cells[1].textContent.trim(),
        affectedArea: affectedArea.trim(),
        reason: reason.trim()
      };
    }).filter(outage => outage !== null);

    console.log(`Processed ${outages.length} outages`);
    return outages;
  } catch (error) {
    console.error(`Error fetching data for district ${districtCode}:`, error.message);
    return [];
  }
}

async function updatePowerOutageData() {
  try {
    // Get all district codes
    const districts = await getDistricts();

    // Clear existing future outages
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM power_outages WHERE date(outage_date) >= date("now")', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Fetch and store new data for each district
    for (const district of districts) {
      const startDate = moment().format('DD-MM-YYYY');
      const endDate = moment().add(7, 'days').format('DD-MM-YYYY');
      
      const outages = await fetchPowerOutageData(district.code, startDate, endDate);
      
      const stmt = db.prepare(`
        INSERT INTO power_outages 
        (district_code, district_name, outage_date, start_time, end_time, affected_area, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const outage of outages) {
        const startMoment = moment(outage.startTime, 'DD/MM/YYYY HH:mm:ss');
        const endMoment = moment(outage.endTime, 'DD/MM/YYYY HH:mm:ss');

        stmt.run([
          district.code,
          district.name,
          startMoment.format('YYYY-MM-DD'),
          startMoment.format('HH:mm:ss'),
          endMoment.format('HH:mm:ss'),
          outage.affectedArea,
          outage.reason
        ]);
      }

      stmt.finalize();
    }

    console.log('Power outage data updated successfully');
  } catch (error) {
    console.error('Error updating power outage data:', error);
  }
}

async function getPowerOutages(districtCode = null, date = null) {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM power_outages WHERE 1=1';
    const params = [];

    if (districtCode) {
      query += ' AND district_code = ?';
      params.push(districtCode);
    }

    if (date) {
      query += ' AND date(outage_date) = date(?)';
      params.push(date);
    }

    query += ' ORDER BY outage_date ASC, start_time ASC';

    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

async function getDistricts() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM districts ORDER BY name ASC', (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

module.exports = {
  fetchPowerOutageData,
  updatePowerOutageData,
  getPowerOutages,
  getDistricts
};
