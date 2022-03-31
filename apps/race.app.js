//
// race
//
// - for Bangle.js 2
// 


const versionString = "version 0.67"; 

//
// 0.67
// added local time display to Timer screen
// 
//
//
//
// 0.66
// removed step activated distance measurement
// set distance limit back to 7.0m from 6.0m
//
//
// 0.65
// use GPS + Beidou
// output only GGA NMEA messages` 
//
//
// 0.64
// use raw NMEA data; use GPS, Beidou, GLONASS
// set distance limit to 6.0m from 7.0m
//
// 0.63
// added barometric altitude correction using average GPS altitude; added log file
// added TCX output file
// added total steps counting		

var img = require("heatshrink").decompress(atob("jMZwkEC6cBkALJgX/+AMJ///DJMP//xCo8yiEf+QtHAAIKGgED/8hl4jHC4MQHgRJGgQCBn4MBJBEf//zGQ5UC/5KBkQrBJY0QIAInGGAJJBkQYGGAJ6IGAQNBBgoVCF4KtGQwcwQARHFG4K1CB4S6JN5DrCTIQAIl7rKgPzBZIATA=="));

var locale = require("locale");

var logging = true;
var initialPointSaved = 0;

//
// log file functions
//

var logFile;
var nmeaFile;

// Create the file in append mode
function createLogFile() {
	logFile = require("Storage").open("race.log","a");
}

function writeLogFile(data)
{
	logFile.write(data);
}

function createNmeaFile() {
	nmeaFile = require("Storage").open("nmea.log","a");
}

function writeNmeaFile(data)
{
	nmeaFile.write(data);
}


if (logging) {
	createLogFile();
	//createNmeaFile();
}


//
// TCX file functions
//

//const now = new Date();
//var TCXfilename = now.toISOString(); // format: "2021-05-30T14:59:15.449Z"

//
// TCX
//

const xmlHeaderString = '<?xml version="1.0" encoding="UTF-8"?>\n';
const tcxHeaderString = '<TrainingCenterDatabase xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd" xmlns:ns5="http://www.garmin.com/xmlschemas/ActivityGoals/v1" xmlns:ns3="http://www.garmin.com/xmlschemas/ActivityExtension/v2" xmlns:ns2="http://www.garmin.com/xmlschemas/UserProfile/v2" xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n';



var TCXfile = undefined;

// Create the file in append mode
function createTCXfile(fname) {
	//var name = fname + ".tcx";
	
	TCXfile = require("Storage").open(fname, "a");
}

function writeTCXfile(data)
{
	if (TCXfile == undefined) {
		return;
	}
	TCXfile.write(data);
}

function writeTCXfileHeader(id) {
	writeTCXfile(xmlHeaderString);
	writeTCXfile(tcxHeaderString);

	writeTCXfile("\t<Activities>\n");
    writeTCXfile('\t\t<Activity Sport="Running">\n');	
	writeTCXfile('\t\t\t<Id>' + id + '</Id>\n');
	writeTCXfile('\t\t\t<Lap>\n');
	writeTCXfile('\t\t\t\t<Track>\n');
}

function writeTCXfileCloser() {
	writeTCXfile('\t\t\t\t</Track>\n');
	writeTCXfile('\t\t\t</Lap>\n');
    writeTCXfile('\t\t</Activity>\n');	
	writeTCXfile("\t</Activities>\n");	
	writeTCXfile("</TrainingCenterDatabase>\n");
	
	TCXfile = undefined;
	TCXopen = false;
}

function writeTCXfileTrackpoint(time, lat, lon, alt, dist) {
	writeTCXfile('\t\t\t\t\t<Trackpoint>\n');	
	writeTCXfile('\t\t\t\t\t\t<Time>' + time + '</Time>`\n');
		
	writeTCXfile('\t\t\t\t\t\t<Position>\n');
	writeTCXfile('\t\t\t\t\t\t\t<LatitudeDegrees>' + lat.toFixed(7) + '</LatitudeDegrees>\n');
	writeTCXfile('\t\t\t\t\t\t\t<LongitudeDegrees>' + lon.toFixed(7) + '</LongitudeDegrees>\n');
	writeTCXfile('\t\t\t\t\t\t</Position>\n');	
	
	writeTCXfile('\t\t\t\t\t\t<AltitudeMeters>' + alt.toFixed(1) + '</AltitudeMeters>`\n');
	writeTCXfile('\t\t\t\t\t\t<DistanceMeters>' + dist.toFixed(0) + '</DistanceMeters>`\n');
	
	writeTCXfile('\t\t\t\t\t</Trackpoint>\n');
}	

//const now = new Date();
var TCXfilename; // = now.toISOString(); // format: "2021-05-30T14:59:15.449Z"
var TCXopen = false;

function startNewTCX()
{
	const now = new Date();
	var str = now.toISOString(); // format: "2021-05-30T14:59:15.449Z"

	const nameArray = str.split(".");
	TCXfilename = nameArray[0] + "z.tcx";
	
	// make new TCX file
	createTCXfile(TCXfilename);	 
	writeTCXfileHeader(TCXfilename);	

	initialPointSaved = 0;
	TCXopen = true;
}

/*
// make new TCX file
createTCXfile(TCXfilename);
writeTCXfileHeader(TCXfilename);
writeTCXfileTrackpoint('2020-10-10T18:27:35Z', 37.234456567567, -122.21763565545, 340.434, 34.545);
writeTCXfileTrackpoint('2020-10-10T18:27:42Z', 37.236456646554, -122.21647955744, 340.754, 45.765);
writeTCXfileCloser();
*/

// end TCX file functions



g.setBgColor(0, 0, 0);
g.setColor(1, 1, 1);

//Bangle.setLCDMode("doublebuffered");
E.showMessage("Loading..."); // avoid showing rubbish on screen

//2022-02-10 revised modes
// 0: distance and pace
// 1: elapsed time; Clear, Start, Stop
// 2: average pace
// 3: Clear - called by swipe in mode 1 (elapsed time)
// 4: altitude differences - called by swipe in mode 0 (distance and pace)
// 5: steps - called by swipe in mode 2 (average pace)



var initialStart = 0;
var outputMode = 0;



let lastFix = {
  "lat": 0.0,
  "lon": 0.0,
  "alt": 0.0,
  "speed": 0.0,
  "course": 0,
  "time": 0,  
  "satellites": 0,
  "fix": 0,
  "hdop": 0 	
};

var nofix = 0;
var averageSpeed = 0.0;
var averagePace = 99.0;
var averageLat = 0.0;
var averageAlt = 0.0;  // from barometer
var averageGPSalt = 0.0;
var gpsStartAlt = 0.0;
var steps = 0;
var totalSteps = 0;
var distance = 0.0;

var nonGGAcount = 0;
var lastGGAtime = 0;

const arraySize = 6;
var GPSspeeds = new Array(arraySize);
var GPSlats = new Array(arraySize);
var GPSlons = new Array(arraySize);
var GPSalts = new Array(arraySize);
var GPStimes = new Array(arraySize);
var GPSdists = new Array(arraySize);



var GPSarrayCount = 0;
var GPSarrayIndex = 0;
var startTime = 0;
var elapsedTime=0;
var timerOn = 0;
var pacePerKm = 4800.0;
var lastTime = 0.0;
var lastDist = 0.0;
var interval = 0.0;

var lastPace = 480.0;
var lastPaceTime = 0.0;
var lastPaceDistance = 0.0;

var lastAvePaceUpdate = 0.0;
var lastAveragePace = 0.0;
var averagePace = 0.0;



// Check settings for what type our clock should be
var is12Hour = (require("Storage").readJSON("setting.json",1)||{})["12hour"];




function getUTCTime(d) {
  return d.toUTCString().split(' ')[4].split(':').map(function(d){return Number(d);});
}

function getLocalTime() {
  // get date
  var d = new Date();
  var da = d.toString().split(" ");
  var dutc = getUTCTime(d);


  // draw time
  var time = da[4].split(":");
  var hours = time[0],
    minutes = time[1],
    seconds = time[2];

  var meridian = "";
  if (is12Hour) {
    hours = parseInt(hours,10);
    meridian = "AM";
    if (hours == 0) {
      hours = 12;
      meridian = "AM";
    } else if (hours >= 12) {
      meridian = "PM";
      if (hours>12) hours -= 12;
    }
    hours = (" "+hours).substr(-2);
  }

  return hours + ":" + minutes + ":" + seconds;
}

function formatTime(now) {
  var fd = now.toUTCString().split(" ");
  var time = fd[4].substr(0, 5);
  var date = [fd[0], fd[1], fd[2]].join(" ");
  //return time + " - " + date;
  return time;
}

function formatSecondsToMinutesSeconds(timeInSeconds) {
  var minutes = timeInSeconds / 60;
  var seconds = timeInSeconds % 60;
  
  var timeStr = minutes.toFixed(0).toString();
  //if (timeInSeconds == 0)
  //  timeStr += "0";
  
  timeStr += ":";
  
  if (seconds < 10)
    timeStr += "0";
  
  timeStr += seconds.toString();
  
  return timeStr;
}  

/*
	haversine
	formula: 	a = siný(ýý/2) + cos ý1 ý cos ý2 ý siný(ýý/2)
				c = 2 ý atan2( a, (1a) )
				d = R * c
			where 	ý is latitude, ý is longitude, R is earths radius (mean radius = 6,371km);
			note that angles need to be in radians to pass to trig functions!
*/
function gpsDistance(lat1, lon1, lat2, lon2)
{
	const R = 6371e3; // metres
	const phi1 = lat1 * Math.PI/180; // in radians
	const phi2 = lat2 * Math.PI/180;
	const deltaPhi = (lat2-lat1) * Math.PI/180;
	const deltaLambda = (lon2-lon1) * Math.PI/180;

	const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
          Math.cos(phi1) * Math.cos(phi2) *
          Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

	const d = R * c; // in metres
	return d;
}

//
// modes:
//    0 distance and pace
//    1 timer
//    2 average pace
//    3 clear time, distance, altitude changes
//    4 altitude changes
//  

var logCount = 0;

function onGPS(fix) {
  //("0 lastFix.alt = " + lastFix.alt.toFixed(1) + "\n");	
  g.clear();
  g.setFontAlign(-1, -1);
  g.drawImage(img, 10, 0);
  
  g.setFont("6x8");
  g.setFontVector(22);
  g.drawString("Race Timer", 40, 0);
  
  var batteryLevel = E.getBattery();
  
  if (batteryLevel < 25.0) {
	  g.setColor(1, 0, 0); // red
	  g.fillCircle(5, 5, 5);
	  g.setColor(1, 1, 1);
  }
  else if (batteryLevel < 35.0) {
	  g.setColor(1, 1, 0); // yellow
	  g.fillCircle(5, 5, 5);
	  g.setColor(1, 1, 1);
  }
  
  /*
  if (logging) {
  	const thisTime = new Date();
  	var timeString = thisTime.toISOString();
  	writeLogFile(timeString + "," + fix.lat + "," + fix.lon + "," + fix.alt + "\n");  
  }
  */

  
  if (fix.fix) {
    //writeLogFile("1 lastFix.alt = " + lastFix.alt.toFixed(1) + "\n");
    if (lastFix.time == 0)
		lastFix.time = fix.time;
    
    if (timerOn == 1) {
		if (startTime == 0)
			startTime = fix.time;
		elapsedTime = (fix.time - startTime) / 1000.0;
		
		if (elapsedTime < 0.0) // crossover to new day
			elapsedTime += 86400;  // seconds per day
    }
    
    nofix = 0;
    var alt = fix.alt;
    var lat = fix.lat;
    var lon = fix.lon;
    var speed = fix.speed;
    var time = fix.time / 1000.0;
    var satellites = fix.satellites;

    var distTimeInterval = 0;
	var deltaDistance0 = 0.0;
    var deltaDistance1 = 0.0;
    var i;
    
//  if (steps > 0) {
    if (GPSarrayCount == arraySize) {
		if (GPSarrayIndex == arraySize)
			GPSarrayIndex = 0;
        
		GPSspeeds[GPSarrayIndex] = speed;
		GPSlats[GPSarrayIndex] = lat;
		GPSlons[GPSarrayIndex] = lon;
		GPSalts[GPSarrayIndex] = alt;
		GPStimes[GPSarrayIndex] = time;    
		GPSarrayIndex++;
    }
    else {
		GPSspeeds[GPSarrayIndex] = speed;
		GPSlats[GPSarrayIndex] = lat;
		GPSlons[GPSarrayIndex] = lon;
		GPSalts[GPSarrayIndex] = alt;
		GPStimes[GPSarrayIndex] = time;   
  
		GPSarrayCount++;
		GPSarrayIndex++;
    }  
      
    /*
    if (steps == 0 && outputMode == 0) {   
		g.setFontVector(20);
		g.drawString("stopped ...", 30, 150);
    }
	*/
      
    averageSpeed = 0.0;
    averageLat = 0.0;
    averageLon = 0.0;
	averageGPSalt = 0.0;
	averageAlt = getAltitude();  // this is the barometric altitude corrected to base GPS altitiude
    averagePace = 0.0;
      
    for (i = 0; i < GPSarrayCount; i++) {
        averageSpeed += GPSspeeds[i];
	    averageLat += GPSlats[i];
	    averageLon += GPSlons[i];
	    averageGPSalt += GPSalts[i];
		//averagePace += GPSpaces[i];
    } 
    
    averageSpeed /= GPSarrayCount;
	averageLat /= GPSarrayCount;
	averageLon /= GPSarrayCount;
	averageGPSalt /= GPSarrayCount;
    //averagePace /= GPSarrayCount;
	
	gpsStartAlt = averageGPSalt;  // used for barometric alt correction
    
    //distTimeInterval = fix.time - lastFix.time;
    //deltaDistance0 = distTimeInterval / 3600.0 * averageSpeed;
      
	if (initialPointSaved == 0) {
		const thisTime = new Date();
		let timeString = thisTime.toISOString();
				
		writeTCXfileTrackpoint(timeString, averageLat, averageLon, averageAlt, 0.0);  				
		initialPointSaved = 1;
		
		lastFix.lat = averageLat;
		lastFix.lon = averageLon;
		lastFix.alt = averageAlt;
	}
	  
	//writeLogFile("2 lastFix.alt = " + lastFix.alt.toFixed(1) + "\n");  
    if (lastFix.lat > 0.0) {
		//if (steps > 0) {
		    var altDiff = 0.0;
		
		    altDiff = averageAlt - lastFix.alt;      
		    deltaDistance1 = gpsDistance(averageLat, averageLon, lastFix.lat, lastFix.lon);
			
			//if (logging) {			
				//writeLogFile("averageAlt = " + averageAlt.toFixed(1) + " lastFix.alt = " + lastFix.alt.toFixed(1) + "\n");			
				//writeLogFile("deltaDist = " + deltaDistance1.toFixed(1) + " altDiff = " + altDiff.toFixed(1) + "\n");			
			//}
			
			interval = time - lastTime;
			
		    if (deltaDistance1 > 7.0) { 
				deltaDistance1 = deltaDistance1 * deltaDistance1;
				altDiff = altDiff * altDiff;      
				deltaDistance1 = Math.sqrt(deltaDistance1 + altDiff);			
			
				const thisTime = new Date();
				let timeString = thisTime.toISOString();
				
				distance += deltaDistance1;
			
				lastFix.time = fix.time;
				lastFix.lat = averageLat;
				lastFix.lon = averageLon;
				lastFix.alt = averageAlt;    
			
				/*
				if (logging) {
					//writeLogFile("av: " + averageLat.toFixed(8) + "," + averageLon.toFixed(8) + "," + averageGPSalt.toFixed(1) + "," + averageAlt.toFixed(1) + "," + + "\n");
					//writeLogFile("new lastFix.alt = " + lastFix.alt.toFixed(1) + "\n");
					//writeLogFile("Dist = " + distance.toFixed(1) + "\n");
					
					var altCorr = averageGPSalt - getBarometerAltitude();
					writeLogFile("Alt gps-baro = " + altCorr.toFixed(1) + "\n");
				}
				*/
				
				writeTCXfileTrackpoint(timeString, averageLat, averageLon, averageAlt, distance);  
				
				if (lastPaceDistance == 0.0) {
					pacePerKm = deltaDistance1 / interval * 1000.0;
					lastPace = pacePerKm;
					lastPaceTime = time;
					lastPaceDistance = distance;					
				}		
				else if (time - lastPaceTime > 1.5) {
					var weighting = 0.7;
					
					pacePerKm = weighting * (time - lastPaceTime) / (distance - lastPaceDistance) * 1000.0;
					pacePerKm += (1.0 - weighting) * lastPace;
					
					if (pacePerKm > 3600.0)
						pacePerKm = 3600.0; 
					
					lastPace = pacePerKm;
					lastPaceTime = time;
					lastPaceDistance = distance;
				}
				//writeLogFile("3 lastFix.alt = " + lastFix.alt.toFixed(1) + "\n"); 
		    }
			/*
			else { // less than minimun distance from last recorded point
				if (logging) {
					const thisTime = new Date();
					var timeString = thisTime.toISOString();
		
					writeLogFile(timeString + "," + deltaDistance1.toFixed(1) + "," + fix.lat + "," + fix.lon + "\n");
				}
			}
			*/
		//}
	}
    
	var s = 15;
	g.setFontVector(55);
    
	if (outputMode == 0) {  // distance and pace
		if (initialStart > 0) {	// up and recording
			g.drawString(distance.toFixed(0), 5, 35);
						
			g.setFontVector(20);
			g.drawString("m", 157, 65);
     
			var pace = pacePerKm;
			var formattedPace = formatSecondsToMinutesSeconds(pace.toFixed(0));
      
			g.setFontVector(50);
			g.drawString(formattedPace, 5, 90);
			g.setFontVector(20);
			g.drawString("/km", 135, 125);
			
			g.setFontVector(25);
			g.drawString(fix.satellites + " sv", 5, 145);
			
		}
		else {  // just started; show GPS and Baro altitudes
			g.setFontVector(50);
			g.drawString(gpsStartAlt.toFixed(0), 5, 25);
			g.setFontVector(20);
			g.drawString("m", 140, 50);
			g.drawString("GPS", 140, 70);
		
			g.setFontVector(50);
			g.drawString(averageBarometerAlt.toFixed(0), 5, 85);
			g.setFontVector(20);
			g.drawString("m", 140, 110);
			g.drawString("Baro", 140, 130);
	
			g.setFontVector(30);
			g.drawString(getLocalTime(), 3, 135);
		}		
		

	}     
	else if (outputMode == 1) {  // timer
		var timerSeconds = elapsedTime.toFixed(0) % 3600;
		var timerHours = elapsedTime / 3600;
		var minutes;
	
    
		//if (timerHours.toFixed(0) > 0) {
			g.setFontVector(40); 
			g.drawString(timerHours.toFixed(0), 5, 30);
		//} 
    
		minutes = formatSecondsToMinutesSeconds(timerSeconds.toFixed(0));
		if (minutes < 10)
			minutes = "0" + minutes;
		
		g.setFontVector(64); 
		g.drawString(minutes, 3, 70);
      
	  
	    g.setFontVector(30);
		g.drawString(getLocalTime(), 3, 135);
	  
		//g.setFontVector(20);
		//g.drawString("Timer", 20, 135);
  
	}
	else if (outputMode == 2) {  // average pace
		var secondsPerKm = 0.0;
   
		if (distance > 0.0)
			secondsPerKm = elapsedTime / distance * 1000.0;  // seconds/m
		
		lastAveragePace = formatSecondsToMinutesSeconds(secondsPerKm.toFixed(0));
		lastAvePaceUpdate = elapsedTime;
		
		if (secondsPerKm > 599)
			g.setFontVector(65); 
		else  
			g.setFontVector(76); 
		
		g.drawString(lastAveragePace, 3, 48);
				
		g.setFontVector(20);
		g.drawString("Average / km", 20, 132);
	}
	else if (outputMode == 3) {  // clear time/distance
		g.setFontVector(25);
		g.drawString("CLEAR", 40, 60);  
		g.drawString("Press Button", 10, 100);  
      
	}	
	else if (outputMode == 4) {  // altitude changes
		var up = getSumUpAltitudes();
		var down = getSumDownAltitudes();
		
		g.setFontVector(60);
		g.drawString(up.toFixed(0), 30, 35);        
		g.drawString(down.toFixed(0), 5, 90);
		
		g.setFontVector(20);
	    g.drawString("Elev. diffs. (m)", 10, 150);  
	}     
	else if (outputMode == 5) {  // total steps
		if (totalSteps > 9999)
			g.setFontVector(65); 
		else  
			g.setFontVector(75); 
		
		g.drawString(totalSteps, 3, 48);
				
		g.setFontVector(20);
		g.drawString("steps", 20, 132);
	}
	else {  // diagnostic
		//g.setFontVector(20);
		//g.drawString("interval", 20, 70);     
		//g.drawString(interval, 20, 70);     
		//g.drawString("deltaDistance1", 20, 70);     
		//g.drawString(deltaDistance1, 20, 95);     
   		//g.drawString("pacePerKm", 20, 120);     
		//g.drawString(pacePerKm, 20, 120);     

	}
    
	//steps = 0;
	

  } else { //no fix   
	if (distance > 0.0) {
	  //g.setColor(1, 0, 0); // red
	  //g.fillCircle(160, 40, 10);
	  //g.setColor(1, 1, 1);
		
	}
	else {
		// Show number of satellites:
		//g.setFontAlign(0,0);
		g.setFontAlign(-1, -1);
		g.setFont("6x8");
		g.setFontVector(40);
		g.drawString(fix.satellites +" sats", 40, 60);
      
		g.setFontVector(22);
		//g.drawString("fix:" + fix.fix, 40, 100);   
	 
		g.drawString(versionString, 20, 130);   
	}  
  }
  //writeLogFile("4 lastFix.alt = " + lastFix.alt.toFixed(1) + "\n"); 
  
  //steps = 0;
  g.flip();
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////

let nmeafix = {
  "lat": 0.0,
  "lon": 0.0,
  "alt": 0.0,
  "speed": 0.0,
  "course": 0,
  "time": 0,  
  "satellites": 0,
  "fix": 0,
  "hdop": 0 	
};

var prevNumSats = 0;
 
//
// time string: hhmmss.sss
//
// returns time in seconds//
// 
function parseTime(t){
	var hours = parseFloat(t.substr(0, 2));
	var minutes = parseFloat(t.substr(2, 2));
	var seconds = parseFloat(t.substr(4));
	
	return hours * 3600.0 + minutes * 60.0 + seconds;	
}
 
 

//
// lat/lon is string of 5 decimals
//
function parseLatLon(s) {
  //var len = s.length;
  var p = s.indexOf('.');
  var degrees = s.substr(0, p - 2);
  var minutes = s.substr(p - 2);
  
  return parseFloat(degrees) +  parseFloat(minutes) / 60.0; 
} 

 //
 // parse $GNGGA message
 //
 // 0      1          2          3 4           5 6 7  8   9     10    
 //        time       latitude     longitude     Q SV     Alt
 // $GNGGA,221011.000,5014.14821,N,11923.75220,W,1,06,2.0,344.6,M,-16.5,M,,*7B
 //
 
 function parseGGA(nmea) {
	let alt0 = lastFix.alt;

	var nmeaArray = nmea.split(","); 
	var isGGA = false;
	
	nmeafix.fix = 0;
	nmeafix.speed = 0.0;
   
	if (nmeaArray[0] == "$GNGGA" || nmeaArray[0] == "$GPGGA") {  
		isGGA = true;
		
		nmeafix.time = parseTime(nmeaArray[1]) * 1000.0;
		
		if (lastGGAtime > 0) {
			if (nmeafix.time - lastGGAtime > 5000) {
				writeLogFile(nmeaArray[1] + ": previous fix was " + (nmeafix.time - lastGGAtime)/1000 + "s ago\n");	
			}
		}
		else 
			writeLogFile(nmeaArray[1] + ": first GGA message\n");
		
		lastGGAtime = nmeafix.time;
		
		if (nmeaArray[2] != "") {
			nmeafix.lat = parseLatLon(nmeaArray[2]);
			
			if (nmeafix.lat > 0.0) {
				if (nmeaArray[3] == "S")
					nmeafix.lat *= -1.0;
		
				nmeafix.lon = parseLatLon(nmeaArray[4]);
				
				if (nmeafix.lon > 0.0) {
					if (nmeaArray[5] == "W")
					nmeafix.lon *= -1.0;
				}
				
				nmeafix.fix = nmeaArray[6];
				nmeafix.satellites = parseInt(nmeaArray[7]);
				
				if (nmeafix.satellites != prevNumSats){
					prevNumSats = nmeafix.satellites;
					writeLogFile(nmeaArray[1] + ": Sats = " + nmeafix.satellites + "\n");
				}
					
				nmeafix.alt = parseFloat(nmeaArray[9]);               
			}
		}
	}
	else {
		nonGGAcount++;		
	}
	
	if (lastFix.alt != alt0)
		writeLogFile("parseGGA lastFix.alt error: " + lastFix.alt.toFixed(1) + "," + alt0.toFixed(1) + "\n");  
	
	return isGGA;
 }
 
 
 
 function nmeaHandler(nmeaStr, dataloss) {	
	//writeNmeaFile(nmeaStr + "\n");
	
	if (parseGGA(nmeaStr)) {
		onGPS(nmeafix);
	}
 }
///////////////////////////////////////////////////////////////////////////////////////////////////////////





//
// modes:
//   swipe left/right
//    0 distance and pace
//    1 timer
//    2 average pace
//
//   swipe up/down     
//    3 clear time, distance, altitude changes
//    4 altitude changes
//  


Bangle.on('swipe', function (direction) {
  if (initialStart == 0) {  // clear and start timer
	outputMode = 3;
 	clearTimeDistance();
	timerOn = 1;
	initialStart = 1;
	Bangle.buzz();
	outputMode = 0;
	
	g.drawString(distance.toFixed(0), 5, 35);
 	g.setFontVector(20);
	g.drawString("m", 157, 70);
     
	var formattedPace = formatSecondsToMinutesSeconds(4800);
      
	g.setFontVector(60);
	g.drawString(formattedPace, 10, 98);
	g.setFontVector(20);
	g.drawString("/km", 135, 140);

	startNewTCX();
  }	
  else if (direction === -1) {  // left
	outputMode--;
	if (outputMode < 0)
		outputMode = 2;
	else if (outputMode == 3) // should not get to CLEAR by swipe left  
		outputMode = 1;
  } 
  else if (direction == 1) { // right
	outputMode++;
	if (outputMode > 2)
		outputMode = 0;
  } 
  else if (direction == 0) { // up or down
	if (outputMode == 1) {  // elapsed time  
		outputMode = 3; // clear time/distance 
	}
	else if (outputMode == 0) { // distance/pace
		outputMode = 4;  // altitude changes
	}
	else if (outputMode == 4) { // altitude changes
		outputMode = 0;  // distance/pace
	}
	else if (outputMode == 2) { // average pace
		outputMode = 5;  // total steps
	}
	else if (outputMode == 5) { // total steps
		outputMode = 2;  // average pace
	}	
  }
});




setWatch(() => {
  if (outputMode == 1) { // elapsed time
    if (timerOn == 1) { // turn timer off
		timerOn = 0;
	 
		writeTCXfileCloser();
		writeLogFile("Non-GGA messages = " + nonGGAcount + "\n");
	}   
    else {  // turn timer on
        timerOn = 1;
		startNewTCX();
	}  
  } 
  else if (outputMode == 3) { // clear 
	clearTimeDistance();
	outputMode = 1;	  
  }
}, BTN, {edge:"rising", debounce:50, repeat:true});


function clearTimeDistance() {
  if (outputMode == 3) {
    
    startTime = 0;
    elapsedTime = 0;
    distance = 0.0;
	steps = 0.0;
	totalSteps = 0;
	
	lastPace = 480;
	lastPaceTime = 0.0;
	lastPaceDistance = 0.0;
	
	lastAveragePace = 0.0;
	lastAvePaceUpdate = 0.0;
	
    timerOn = 0;
	
	clearAltitude();

	g.setFontVector(70); 
    g.drawString(formatSecondsToMinutesSeconds(elapsedTime.toFixed(0)), 
                 10, 80);
    g.flip();
  }  
}



Bangle.on('step', (up) => {
  steps++;
  totalSteps++;
});
          


Bangle.setGPSPower(0);
Serial1.setup(9600,{rx:D30, tx:D31});
Serial1.println("$PCAS04,3*1A"); // GPS + BDS
Serial1.println("$PCAS03,1,0,0,0,0,0,0,0,0,,0,,,0*33");   // only output GGA
Bangle.on('GPS-raw', nmeaHandler);
Bangle.setGPSPower(1);



E.on('kill', function() {
  if (TCXopen)	
	writeTCXfileCloser();

  writeLogFile("Non-GGA messages = " + nonGGAcount + "\n");
  
});


//
// Barometer functions
//
const barometerArraySize = 10;
var BarometerAlts = new Array(barometerArraySize);
var BarometerArrayCount = 0;
var BarometerArrayIndex = 0;

var startAltitude = 0.0;
var minAltitude = 99999.99;
var maxAltitude = -99999.99;
var sumUpAltitudes = 0.0;
var sumDownAltitudes = 0.0;

var lastAltitude = 0.0;
var averageBarometerAlt = 0.0;
var barometricAltCorr = 0.0;

function getAltitude()
{
	return averageBarometerAlt + barometricAltCorr;
}

function getBarometerAltitude()
{
	return averageBarometerAlt;
}

function getMinAltitude()
{
	return minAltitude;
}

function getMaxAltitude()
{
	return maxAltitude;
}

function getSumUpAltitudes()
{
	return sumUpAltitudes;
}

function getSumDownAltitudes()
{
	return sumDownAltitudes;
}

function setBarometricAltCorr(gpsAlt)
{
	barometricAltCorr = gpsAlt - averageBarometerAlt;

}

function clearAltitude()
{
	//BarometerArrayCount = 0;
	//BarometerArrayIndex = 0;

	barometricAltCorr = gpsStartAlt - averageBarometerAlt;
	
	startAltitude = averageBarometerAlt;
	minAltitude = 99999.99;
	maxAltitude = -99999.99;
	sumUpAltitudes = 0.0;
	sumDownAltitudes = 0.0;

	lastAltitude = averageBarometerAlt;
	//averageAltitude = 0.0;
	
	if (logging) {
		writeLogFile("gpsStartAlt = " + gpsStartAlt.toFixed(1) + "\n");
		writeLogFile("averageBarometerAlt = " + averageBarometerAlt.toFixed(1) + "\n");
		writeLogFile("barometricAltCorr = " + barometricAltCorr.toFixed(1) + "\n");
	}	
}

  
function onPressure(data) {
  var rawAltitude = 0.0;
  //writeLogFile("baro0 lastFix.alt = " + lastFix.alt.toFixed(1) + "\n");  
  
  if (data.altitude === undefined) {
      rawAltitude = 0.0;
  }
  else {
     rawAltitude = data.altitude; 
  }
  
  if (rawAltitude > 0.0) {
    if (BarometerArrayCount == barometerArraySize) {
       if (BarometerArrayIndex == barometerArraySize)
         BarometerArrayIndex = 0;
        
 	   BarometerAlts[BarometerArrayIndex] = rawAltitude;
	   BarometerArrayIndex++;
    }
    else {
	    BarometerAlts[BarometerArrayIndex] = rawAltitude;
		BarometerArrayCount++;
	    BarometerArrayIndex++;
    }  
  }

  if (BarometerArrayCount > 0) {
  //if (BarometerArrayCount == barometerArraySize) {
	  var sumAlts = 0.0;
	  var i;
	  
	  for (i = 0; i < BarometerArrayCount; i++) {
		  sumAlts += BarometerAlts[i];
	  }
	  
	  averageBarometerAlt = sumAlts / BarometerArrayCount;
  }

  if (averageBarometerAlt > 0.0) {	  
    var altitudeDiff = 0.0;
		
    if (startAltitude == 0.0)
		startAltitude = averageBarometerAlt;
		
	if (averageBarometerAlt < minAltitude)
		minAltitude = averageBarometerAlt;
		
	if (averageBarometerAlt > maxAltitude)
		maxAltitude = averageBarometerAlt;
	
	if (lastAltitude > 0.0)
		altitudeDiff = averageBarometerAlt - lastAltitude;
	else {
		altitudeDiff = 0.0;
		lastAltitude = averageBarometerAlt;	
	}

	if (Math.abs(altitudeDiff) > 1.9) {
		if (altitudeDiff > 0.0)
			sumUpAltitudes += altitudeDiff;
		else
			sumDownAltitudes += altitudeDiff;

		lastAltitude = averageBarometerAlt;	
	}
	
  }  
  
  //if (logging)
  //	writeLogFile(averageBarometerAlt.toFixed(1) +"\n")
  //writeLogFile("baro1 lastFix.alt = " + lastFix.alt.toFixed(1) + "\n");  
}  


Bangle.setBarometerPower(true); 
Bangle.on('pressure', onPressure);


