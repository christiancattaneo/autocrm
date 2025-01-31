import type { TicketResponse } from '../types/ticket'

export interface PRDTestCase {
  title: string
  description: string
  key_features: string[]
  core_functionality: string
  target_audience: string
  expected_keywords: string[]
}

export const PRD_TEST_CASES: PRDTestCase[] = [
  {
    title: "Create PRD for Instagram-like social media platform",
    description: "We need a detailed product requirements document for a photo and video sharing social network similar to Instagram. Focus on core features and user experience.",
    key_features: ["Photo/video sharing", "Stories", "Direct messaging", "Explore feed", "Reels"],
    core_functionality: "Visual content sharing and social networking",
    target_audience: "Young adults and content creators",
    expected_keywords: ["filters", "engagement", "followers", "feed", "stories", "sharing", "social graph"]
  },
  {
    title: "TikTok-style short video platform PRD request",
    description: "Need a comprehensive PRD for a short-form video platform similar to TikTok. Include key features and algorithmic content distribution.",
    key_features: ["Short videos", "Sound library", "Video effects", "For You Page", "Creator tools"],
    core_functionality: "Short-form video creation and discovery",
    target_audience: "Gen Z and young millennials",
    expected_keywords: ["algorithm", "viral", "trends", "sounds", "effects", "discovery", "engagement"]
  },
  {
    title: "YouTube-like video platform PRD requirements",
    description: "Requesting a PRD for a video sharing and streaming platform similar to YouTube. Focus on content creator tools and monetization.",
    key_features: ["Video hosting", "Channel system", "Monetization", "Comments", "Playlists"],
    core_functionality: "Long-form video content sharing and monetization",
    target_audience: "Content creators and general viewers",
    expected_keywords: ["monetization", "subscribers", "analytics", "streaming", "channels", "engagement"]
  },
  {
    title: "Snapchat-style ephemeral messaging app PRD",
    description: "Need PRD for an ephemeral messaging application similar to Snapchat. Include AR features and privacy considerations.",
    key_features: ["Disappearing messages", "AR filters", "Stories", "Snap Map", "Discover"],
    core_functionality: "Ephemeral messaging and AR experiences",
    target_audience: "Teenagers and young adults",
    expected_keywords: ["privacy", "filters", "AR", "ephemeral", "stories", "location", "messaging"]
  },
  {
    title: "X (Twitter) microblogging platform PRD development",
    description: "Create a PRD for a microblogging platform similar to X (formerly Twitter). Focus on real-time communication and content distribution.",
    key_features: ["Microblogging", "Following system", "Trending topics", "Retweets", "Direct messages"],
    core_functionality: "Real-time public conversation and news sharing",
    target_audience: "News enthusiasts and opinion leaders",
    expected_keywords: ["trending", "hashtags", "followers", "timeline", "engagement", "viral"]
  },
  {
    title: "Reddit-style community platform PRD request",
    description: "Need a PRD for a community-driven discussion platform similar to Reddit. Include content moderation and community management features.",
    key_features: ["Subreddits", "Voting system", "Awards", "Moderation tools", "Threading"],
    core_functionality: "Community-driven content aggregation and discussion",
    target_audience: "Interest-based communities",
    expected_keywords: ["moderation", "karma", "communities", "voting", "discussion", "awards"]
  },
  {
    title: "Facebook social network PRD development",
    description: "Requesting PRD for a comprehensive social networking platform similar to Facebook. Focus on connecting people and sharing life updates.",
    key_features: ["News Feed", "Groups", "Events", "Marketplace", "Pages"],
    core_functionality: "Social networking and content sharing",
    target_audience: "General population across age groups",
    expected_keywords: ["friends", "groups", "events", "privacy", "sharing", "networking"]
  },
  {
    title: "Amazon-style e-commerce platform PRD",
    description: "Need PRD for a large-scale e-commerce platform similar to Amazon. Include marketplace and fulfillment features.",
    key_features: ["Product listings", "Shopping cart", "Reviews", "Prime-like service", "Fulfillment"],
    core_functionality: "Online retail and marketplace",
    target_audience: "Online shoppers and sellers",
    expected_keywords: ["marketplace", "fulfillment", "reviews", "recommendations", "shopping"]
  },
  {
    title: "eBay auction platform PRD requirements",
    description: "Create PRD for an auction-style marketplace platform similar to eBay. Focus on bidding system and seller tools.",
    key_features: ["Auctions", "Buy It Now", "Seller tools", "Bidding system", "Categories"],
    core_functionality: "Online auctions and marketplace",
    target_audience: "Buyers and sellers of various items",
    expected_keywords: ["auctions", "bidding", "listings", "seller tools", "categories"]
  },
  {
    title: "Etsy-style handmade marketplace PRD",
    description: "Requesting PRD for a handmade and vintage items marketplace similar to Etsy. Include seller tools and discovery features.",
    key_features: ["Shop profiles", "Custom listings", "Categories", "Search filters", "Reviews"],
    core_functionality: "Handmade and vintage items marketplace",
    target_audience: "Artisans and craft enthusiasts",
    expected_keywords: ["handmade", "vintage", "crafts", "sellers", "discovery", "unique"]
  },
  {
    title: "Shopify e-commerce platform PRD development",
    description: "Need PRD for an e-commerce platform similar to Shopify. Focus on merchant tools and customization options.",
    key_features: ["Store builder", "Payment processing", "Inventory management", "Analytics", "Apps"],
    core_functionality: "E-commerce platform for merchants",
    target_audience: "Online merchants and retailers",
    expected_keywords: ["merchants", "stores", "inventory", "payments", "customization"]
  },
  {
    title: "WhatsApp messaging app PRD request",
    description: "Create PRD for a messaging platform similar to WhatsApp. Include encryption and group features.",
    key_features: ["Messaging", "Voice/Video calls", "Groups", "Status updates", "Web version"],
    core_functionality: "Secure messaging and communication",
    target_audience: "Global messaging users",
    expected_keywords: ["encryption", "messaging", "calls", "groups", "status", "privacy"]
  },
  {
    title: "Telegram messaging platform PRD development",
    description: "Need PRD for a feature-rich messaging platform similar to Telegram. Focus on channels and bot capabilities.",
    key_features: ["Channels", "Bots", "Groups", "File sharing", "Secret chats"],
    core_functionality: "Advanced messaging and content distribution",
    target_audience: "Privacy-conscious users and communities",
    expected_keywords: ["channels", "bots", "privacy", "groups", "sharing", "features"]
  },
  {
    title: "Discord community platform PRD requirements",
    description: "Requesting PRD for a community-focused chat platform similar to Discord. Include server management and voice features.",
    key_features: ["Servers", "Voice channels", "Text channels", "Roles", "Integrations"],
    core_functionality: "Community chat and voice communication",
    target_audience: "Gaming and interest-based communities",
    expected_keywords: ["servers", "voice", "roles", "community", "gaming", "chat"]
  },
  {
    title: "PayPal payment platform PRD development",
    description: "Create PRD for a digital payment platform similar to PayPal. Focus on security and user experience.",
    key_features: ["Money transfers", "Payment processing", "Buyer protection", "Business tools", "International"],
    core_functionality: "Digital payments and money transfers",
    target_audience: "Online buyers and sellers",
    expected_keywords: ["payments", "security", "transfers", "protection", "international"]
  },
  {
    title: "Venmo social payments app PRD request",
    description: "Need PRD for a social payment application similar to Venmo. Include social features and quick transfers.",
    key_features: ["Social feed", "Quick pay", "Split bills", "Bank transfers", "QR codes"],
    core_functionality: "Social payments and money transfers",
    target_audience: "Young adults and social groups",
    expected_keywords: ["social", "payments", "splitting", "transfers", "friends"]
  },
  {
    title: "Cash App financial platform PRD development",
    description: "Requesting PRD for a financial platform similar to Cash App. Include banking and investment features.",
    key_features: ["Money transfers", "Banking", "Stocks", "Bitcoin", "Cash Card"],
    core_functionality: "Financial services and investments",
    target_audience: "Young adults and investors",
    expected_keywords: ["banking", "investing", "transfers", "stocks", "bitcoin"]
  },
  {
    title: "Uber ride-sharing platform PRD requirements",
    description: "Create PRD for a ride-sharing platform similar to Uber. Focus on matching system and safety features.",
    key_features: ["Ride matching", "Payment processing", "Driver app", "Safety features", "Ratings"],
    core_functionality: "On-demand transportation",
    target_audience: "Urban commuters and drivers",
    expected_keywords: ["rides", "drivers", "safety", "matching", "payments"]
  },
  {
    title: "Airbnb accommodation platform PRD development",
    description: "Need PRD for a property rental platform similar to Airbnb. Include booking system and host tools.",
    key_features: ["Property listings", "Booking system", "Reviews", "Host tools", "Experiences"],
    core_functionality: "Property rental and experiences marketplace",
    target_audience: "Travelers and property hosts",
    expected_keywords: ["bookings", "properties", "hosts", "reviews", "experiences"]
  },
  {
    title: "DoorDash food delivery platform PRD request",
    description: "Requesting PRD for a food delivery platform similar to DoorDash. Focus on ordering and delivery systems.",
    key_features: ["Restaurant listings", "Order tracking", "Payment processing", "Driver app", "Ratings"],
    core_functionality: "Food delivery and restaurant marketplace",
    target_audience: "Food delivery customers and restaurants",
    expected_keywords: ["delivery", "restaurants", "orders", "tracking", "drivers"]
  }
]

// Helper function to get a test case by app name
export function getPRDTestCase(appName: string): PRDTestCase | undefined {
  return PRD_TEST_CASES.find(testCase => 
    testCase.title.toLowerCase().includes(appName.toLowerCase())
  )
}

// Helper function to create a ticket response for testing
export function createTestResponse(testCase: PRDTestCase): TicketResponse {
  const prdContent = `
Product Requirements Document: ${testCase.title}

1. Overview
${testCase.description}

2. Target Audience
${testCase.target_audience}

3. Core Functionality
${testCase.core_functionality}

4. Key Features
${testCase.key_features.map((feature, index) => `${index + 1}. ${feature}`).join('\n')}

5. Technical Requirements
- Scalable architecture to support user growth
- Robust security measures
- Mobile and web platform support
- Real-time data synchronization
- API integrations

6. User Experience Requirements
- Intuitive navigation
- Fast loading times
- Responsive design
- Accessibility compliance
- Clear error handling

7. Security Requirements
- End-to-end encryption where applicable
- Secure user authentication
- Data privacy compliance
- Regular security audits
- Secure payment processing

8. Performance Metrics
- 99.9% uptime
- < 2 second page load time
- Support for concurrent users
- Efficient data caching
- Regular performance monitoring

9. Success Criteria
${testCase.expected_keywords.map(keyword => `- Successful implementation of ${keyword} functionality`).join('\n')}

10. Timeline and Phases
Phase 1: Core Feature Development
Phase 2: Beta Testing
Phase 3: Public Launch
Phase 4: Feature Enhancements

11. Risks and Mitigation
- Scalability challenges
- Security vulnerabilities
- User adoption
- Technical debt
- Competition

12. Future Considerations
- AI/ML integration opportunities
- International expansion
- Advanced analytics
- Enhanced automation
- Community features
`

  return {
    id: Math.floor(Math.random() * 1000),
    ticket_id: Math.floor(Math.random() * 1000),
    content: prdContent,
    author_id: "test-author",
    author_email: "test@example.com",
    response_type: "ai_generated",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
} 