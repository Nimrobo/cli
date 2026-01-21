# Nimrobo CLI - Quick Reference

Both command namespaces share the same authentication system.

## Global Auth Commands (Shared)

1. `nimrobo login` - Login with credentials
2. `nimrobo logout` - Logout from CLI
3. `nimrobo status` - Show login status

## Screen Commands (Voice Screening Platform)

### User
4. `nimrobo screen user profile` - Get current user profile

### Projects
5. `nimrobo screen projects list` - List all projects
6. `nimrobo screen projects get` - Get project details
7. `nimrobo screen projects create` - Create new project
8. `nimrobo screen projects update` - Update project
9. `nimrobo screen projects use` - Set active project

### Links
10. `nimrobo screen links list` - List screening links
11. `nimrobo screen links create` - Create screening link
12. `nimrobo screen links cancel` - Cancel active link
13. `nimrobo screen links update` - Update link settings

### Sessions
14. `nimrobo screen sessions status` - Get session status
15. `nimrobo screen sessions transcript` - Get session transcript
16. `nimrobo screen sessions audio` - Download session audio
17. `nimrobo screen sessions evaluation` - Get session evaluation
18. `nimrobo screen sessions summary` - Get session summary
19. `nimrobo screen sessions summary-regenerate` - Regenerate session summary

---

## Net Commands (Matching Network)

### My Profile & Data
1. `nimrobo net my profile` - Get current user
2. `nimrobo net my update` - Update profile
3. `nimrobo net my orgs` - List my organizations
4. `nimrobo net my posts` - List my posts
5. `nimrobo net my applications` - List my applications
6. `nimrobo net my invites` - List my received invites
7. `nimrobo net my join-requests` - List my join requests
8. `nimrobo net my summary` - Get user summary

### Users
9. `nimrobo net users get <userId>` - Get user by ID
10. `nimrobo net users search` - Search users

### Organizations
11. `nimrobo net orgs create` - Create organization
12. `nimrobo net orgs list` - List organizations
13. `nimrobo net orgs get <orgId>` - Get organization
14. `nimrobo net orgs update <orgId>` - Update organization
15. `nimrobo net orgs delete <orgId>` - Delete organization
16. `nimrobo net orgs posts <orgId>` - List organization posts
17. `nimrobo net orgs leave <orgId>` - Leave organization

### Organization Management
18. `nimrobo net orgs manage members <orgId>` - List members
19. `nimrobo net orgs manage remove-member <orgId> <userId>` - Remove member
20. `nimrobo net orgs manage update-member <orgId> <userId>` - Update member role
21. `nimrobo net orgs manage send-invite <orgId>` - Send invite
22. `nimrobo net orgs manage invites <orgId>` - List pending invites
23. `nimrobo net orgs manage cancel-invite <orgId> <inviteId>` - Cancel invite
24. `nimrobo net orgs manage send-join-request <orgId>` - Request to join
25. `nimrobo net orgs manage join-requests <orgId>` - List join requests
26. `nimrobo net orgs manage accept-invite <inviteId>` - Accept invite
27. `nimrobo net orgs manage decline-invite <inviteId>` - Decline invite
28. `nimrobo net orgs manage approve-join-request <joinRequestId>` - Approve request
29. `nimrobo net orgs manage reject-join-request <joinRequestId>` - Reject request
30. `nimrobo net orgs manage cancel-join-request <joinRequestId>` - Cancel request

### Posts
31. `nimrobo net posts create` - Create post
32. `nimrobo net posts list` - List posts
33. `nimrobo net posts get <postId>` - Get post
34. `nimrobo net posts update <postId>` - Update post
35. `nimrobo net posts close <postId>` - Close post
36. `nimrobo net posts delete <postId>` - Delete post
37. `nimrobo net posts apply <postId>` - Apply to post
38. `nimrobo net posts applications <postId>` - List applications for post
39. `nimrobo net posts check-applied <postId>` - Check if applied

### Applications
40. `nimrobo net applications get <applicationId>` - Get application
41. `nimrobo net applications accept <applicationId>` - Accept application
42. `nimrobo net applications reject <applicationId>` - Reject application
43. `nimrobo net applications withdraw <applicationId>` - Withdraw application
44. `nimrobo net applications batch-action` - Batch accept/reject applications

### Channels
45. `nimrobo net channels list` - List my channels
46. `nimrobo net channels get <channelId>` - Get channel
47. `nimrobo net channels messages <channelId>` - List messages
48. `nimrobo net channels send <channelId>` - Send message
49. `nimrobo net channels message <channelId> <messageId>` - Get single message
50. `nimrobo net channels mark-read <channelId> <messageId>` - Mark message as read
51. `nimrobo net channels mark-unread <channelId> <messageId>` - Mark message as unread
52. `nimrobo net channels read-all <channelId>` - Mark all messages as read
