/**
 * Services Index
 * 
 * Central export point for all service modules.
 * Services contain business logic and external API integrations.
 * 
 * USAGE:
 * import { authService, membershipService, contentService, adminService, boostService } from '@/services';
 */

export { authService } from './auth.service';
export { membershipService } from './membership.service';
export { contentService } from './content.service';
export { adminService } from './admin.service';
export { boostService } from './boost.service';

// Payment service for Stripe integration
export * as paymentService from './payment.service';

// Streaming service for live streams
export * as streamingService from './streaming.service';

// Chat service for live stream chat
export * as chatService from './chat.service';

// Recording/VOD service
export * as recordingService from './recording.service';

// Future services (uncomment when implemented):
// export { userService } from './user.service';
// export { creatorService } from './creator.service';
// export { subscriptionService } from './subscription.service';

