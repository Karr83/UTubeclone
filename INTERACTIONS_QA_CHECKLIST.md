# Interactions QA Checklist

Use this checklist after pulling latest changes and reloading Expo.

## 1) Live Stream Screen

- Open a live stream.
- Tap `Like` -> icon should switch on.
- Tap `Dislike` -> dislike should switch on and like should switch off.
- Tap `Like` again -> reaction should clear.
- Tap `Share` -> native share sheet should open.
- Tap `Subscribe` in creator section -> should toggle subscribe/unsubscribe alert.
- Open same stream again -> previous like/dislike + subscribe state should persist for your user.

## 2) Replay Screen (VOD)

- Open any recording.
- Tap `Like` / `Dislike` and verify mutual toggle behavior.
- Tap `Share` and confirm native share sheet opens.
- Tap `Subscribe` and confirm it toggles.
- Tap `Add a comment...`, submit a comment.
- Confirm new comment appears in comments list.
- Close and reopen replay screen; confirm comment is still there (Firestore-backed).

## 3) Chat

- Open live stream chat.
- Confirm no more "index is building" error after app reload.
- Send a message and verify it appears.
- Confirm no nested VirtualizedList warning appears.

## 4) Profile

- Open Profile -> `Edit Profile`; change display name and save.
- Open Profile -> `Change Password`; verify current/new/confirm flow works on Android.

## 5) Firestore Verification

- Check `streams/{streamId}/reactions/{userId}` docs are created.
- Check `recordings/{recordingId}/reactions/{userId}` docs are created.
- Check `recordings/{recordingId}/comments/{commentId}` docs are created.
- Check `subscriptions/{userId}_{creatorId}` docs are created/deleted on toggle.
