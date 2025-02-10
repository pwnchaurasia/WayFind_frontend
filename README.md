## Wayfind Front end app.


## Design

design of this app comes from opensource figma design, 

https://www.figma.com/design/CPtQiQwniN46WdT4bexH9V/Location-tracking%2C-SOS%2C-Safety-app-UI---parent-and-child-(Community)?node-id=504-1858
https://www.figma.com/design/GLSc6Lyt3yDreilAcfdPdF/Tracking-Map-Application-(Community)?node-id=1-3&p=f&t=gNYFJBMWpi5O9999-0

Both will be used as reference,
I dont intend any copy right infriegement, I searched for free design and few came up. and i selected these too.





## Tasks

- [] Splash Screen
- [] Login Screen
- [] OTP verify screen
- [] Update profile, with name and email
- [] Create Group
- [] Share Group join link
- [] Join group via link
- [] Show all user's groups
- [] Show map, and render group members location as marker on map.
- [] display tab on bottom, l -> r : back, location, Speak, members, voice notes.
- [] members list would be displayed on scrollable overlay. with Their Name: and phone number and call button
- [] On top there would be gather around button, when clicked all user would get notification to gather at meeting point.(only available to admin).
- [] SOS button, will send notification to all admins.
- [] Make any user admin of the group.
- [] Speak button when clicked, will record your voice for 45 seconds. and then auto send to all members of the group, and when user receives the message, it would be auto played loud. in ur BT device if conneccted else on speaker.
- [] Setting to auto play incoming messages or not option for members.
- [] Admin can create a ride. select start and end location, a path would be drawn.
- [] Every person would follow on the same path.
- [] When clicked on any marker, we can get the direction to the person open in google map app.
- [] Location update will happen every minute.






1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```