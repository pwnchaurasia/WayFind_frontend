# Wayfind Front end app.


## Project Requirements

### Overview

The Wayfind Front end app is designed to provide location tracking, SOS, and safety features for riders and admins. The design references are sourced from open-source Figma designs.

### Design References

- [Location tracking, SOS, Safety app UI - parent and child (Community)](https://www.figma.com/design/CPtQiQwniN46WdT4bexH9V/Location-tracking%2C-SOS%2C-Safety-app-UI---parent-and-child-(Community)?node-id=504-1858)
- [Tracking Map Application (Community)](https://www.figma.com/design/GLSc6Lyt3yDreilAcfdPdF/Tracking-Map-Application-(Community)?node-id=1-3&p=f&t=gNYFJBMWpi5O9999-0)

### Features

1. **Splash Screen**: Initial screen displayed when the app is launched.
2. **Login Screen**: Screen for user authentication.
3. **OTP Verify Screen**: Screen for OTP verification.
4. **Update Profile**: Screen to update user profile with name and email.
5. **Create Group**: Feature to create a new group.
6. **Share Group Join Link**: Feature to share a link to join a group.
7. **Join Group via Link**: Feature to join a group using a link.
8. **Show All User's Groups**: Display all groups the user is part of.
9. **Show Map with Group Members' Locations**: Render group members' locations as markers on the map.
10. **Bottom Tab Navigation**: Tabs for navigation - back, location, speak, members, voice notes.
11. **Members List Overlay**: Scrollable overlay displaying members' names, phone numbers, and call buttons.
12. **Gather Around Button**: Button for admins to notify all users to gather at a meeting point.
13. **SOS Button**: Button to send an SOS notification to all admins.
14. **Make User Admin**: Feature to promote any user to admin.
15. **Speak Button**: Record and send voice messages to group members.
16. **Auto Play Incoming Messages**: Setting to auto-play incoming messages.
17. **Create a Ride**: Admin feature to create a ride with start and end locations.
18. **Follow Path**: Feature for users to follow a designated path.
19. **Get Directions to Member**: Feature to get directions to a member via Google Maps.
20. **Location Update**: Update location every minute.




### Installation

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```
3. To update all the packages and dependencies
   ```bash
      expo install --fix -- --legacy-peer-deps
   ```

### Tasks

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



## Update expo

```bash
   npx expo install expo@latest
   npx expo install --check -- --legacy-peer-deps
   npx expo start
```


## Notes

1. Icon color green code: 0C7937



## For otp entry use this install react-native-otp-entry