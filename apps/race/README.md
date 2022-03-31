RACE: A Bangle.js 2 App for Run and Bicycle Events


When the app is launched:
- Race Timer, O sats, version number are displayed
- this screen will be displayed until a GPS fix is acquired

Once a GPS fix is acquired, averaged GPS and barometric derived altitudes are shown
- the averaged GPS initial altitude will be used as the start altitude when recording points
- during the timed event, GPS will be used for horizontal positions while altitudes will be derived from changes in barometric pressure.

When you are ready to start your event:
- swiping up/down on this screen will clear accumulated measurements and start timer and recording to TCX file. The watch will buzz to indicate success.
- the display will change to the Distance and Pace mode



DISPLAY MODES
- swipe left / right to change between the Main Display Modes


THE MAIN DISPLAY MODES:

Distance and Pace; Altitude gain/loss 
- swipe up / down to change between Distance and Altitude
- the Distance and Pace display also shows the number of satellites used

Average Pace; Total Steps 
- swipe up / down to change between Average Pace and Tota Steps

Elapsed Time; Clear 
- to Clear, swipe up /down to get the Clear prompt, and then press Button to Clear. To leave the Clear screen without Clearing, swipe up/down to go back to the Elapsed Time screen
- when elapsed time is shown, press Button to Start / Stop timer
- when elapsed time is running, geographical coordinates are saved to a TCX file.


TCX FILES

TCX files are XML files developed by Garmin for storing GPS points and other information.  There are free TCX file viewing software available which will show the run route saved to the TCX files. 

The initial start-up with a swipe starts recording to a new TCX file (name based on UTC time).  To stop the recording, swipe to the Timer screen and press the Button. 

Alternatively, exiting the Race app from any mode will stop the recording and properly close the TCX file.

Another way to start recording to a new TCX file is to go to the Timer screen and press the Button.  This will stop the timer and close the existing TCX file.  Pressing the Button again will start the timer and start recording to a new TCX file. 


NOTES:
- This app has not yet been programmed to record laps. It is meant to be used for a single timed event.
- No provision yet has been made for displaying distances in miles. Distances are in meters and pace is in minutes/kilometer.            

