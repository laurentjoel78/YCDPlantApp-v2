module.exports = function defineAssociations(models) {
  const {
    User,
    Farm,
    Crop,
    FarmCrop,
    FarmGuideline,
    Advisory,
    AdvisoryResponse,
    Notification,
    Product,
    Order,
    Market,
    MarketCrop,
    MarketReview,
    Transaction,
    EscrowAccount,
    Wallet,
    Expert,
    AuditLog,
    SystemLog,
    PerformanceLog,
    VoiceCommand,
    MarketProduct,
    PriceHistory,
    WeatherData,
    GuidanceTemplate,
    Translation,
    LanguagePack,
    LanguagePreference,
    ForumPost,
    ForumTopic,
    ForumModeration,
    Consultation,
    CommissionTransaction,
    ExpertReview,
    ForumMember,
    ForumMessage,
    Cart,
    CartItem
  } = models;

  // User associations
  User.hasMany(Advisory, { as: 'farmerAdvisories', foreignKey: 'farmer_id' });
  User.hasMany(Advisory, { as: 'expertAdvisories', foreignKey: 'expert_id' });
  User.hasMany(AdvisoryResponse, { foreignKey: 'user_id' });
  User.hasMany(Notification, { foreignKey: 'user_id' });
  User.hasMany(Product, { as: 'products', foreignKey: 'seller_id' });
  User.hasMany(Order, { as: 'buyerOrders', foreignKey: 'buyer_id' });
  User.hasMany(Order, { as: 'sellerOrders', foreignKey: 'seller_id' });
  User.hasMany(Farm, { as: 'farms', foreignKey: 'farmer_id' });
  User.hasMany(MarketReview, { foreignKey: 'user_id', as: 'marketReviews' });

  // Farm associations
  Farm.belongsTo(User, { as: 'farmer', foreignKey: 'farmer_id' });
  Farm.hasMany(FarmCrop, { as: 'crops', foreignKey: 'farm_id' });
  FarmCrop.belongsTo(Farm, { as: 'farm', foreignKey: 'farm_id' });
  FarmCrop.belongsTo(Crop, { as: 'crop', foreignKey: 'crop_id' });
  Farm.hasMany(FarmGuideline, { as: 'guidelines', foreignKey: 'farm_id' });
  FarmGuideline.belongsTo(Farm, { as: 'farm', foreignKey: 'farm_id' });
  FarmGuideline.belongsTo(GuidanceTemplate, { as: 'template', foreignKey: 'template_id' });
  GuidanceTemplate.hasMany(FarmGuideline, { as: 'farmGuidelines', foreignKey: 'template_id' });
  Farm.hasMany(Advisory, { foreignKey: 'farm_id' });
  Farm.belongsToMany(Crop, { through: FarmCrop, foreignKey: 'farm_id' });
  Farm.hasMany(Product, { foreignKey: 'farm_id' });

  // Crop associations
  Crop.hasMany(Advisory, { foreignKey: 'crop_id' });
  Crop.belongsToMany(Farm, { through: FarmCrop, foreignKey: 'crop_id' });
  Crop.belongsToMany(Market, {
    through: MarketCrop,
    foreignKey: 'crop_id',
    otherKey: 'market_id',
    as: 'markets'
  });
  Crop.hasMany(Product, { foreignKey: 'crop_id' });

  // Advisory associations
  Advisory.belongsTo(User, { as: 'farmer', foreignKey: 'farmer_id' });
  Advisory.belongsTo(User, { as: 'expert', foreignKey: 'expert_id' });
  Advisory.belongsTo(Farm, { foreignKey: 'farm_id' });
  Advisory.belongsTo(Crop, { foreignKey: 'crop_id' });
  Advisory.hasMany(AdvisoryResponse, { foreignKey: 'advisory_id' });

  // AdvisoryResponse associations
  AdvisoryResponse.belongsTo(Advisory, { foreignKey: 'advisory_id' });
  AdvisoryResponse.belongsTo(User, { foreignKey: 'user_id' });

  // Notification associations
  Notification.belongsTo(User, { foreignKey: 'user_id' });

  // Market associations
  Market.hasMany(Product, { foreignKey: 'market_id' });
  Market.belongsToMany(Crop, {
    through: MarketCrop,
    foreignKey: 'market_id',
    otherKey: 'crop_id',
    as: 'acceptedCrops'
  });
  Market.hasMany(MarketReview, { foreignKey: 'market_id', as: 'reviews' });

  // MarketCrop associations (join table)
  MarketCrop.belongsTo(Market, { foreignKey: 'market_id' });
  MarketCrop.belongsTo(Crop, { foreignKey: 'crop_id' });

  // MarketReview associations
  MarketReview.belongsTo(Market, { foreignKey: 'market_id', as: 'market' });
  MarketReview.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Product associations
  Product.belongsTo(User, { as: 'seller', foreignKey: 'seller_id' });
  Product.belongsTo(Farm, { foreignKey: 'farm_id' });
  Product.belongsTo(Crop, { foreignKey: 'crop_id' });
  Product.belongsTo(Market, { foreignKey: 'market_id' });
  Product.hasMany(Order, { foreignKey: 'product_id' });

  // Order associations
  Order.belongsTo(User, { as: 'buyer', foreignKey: 'buyer_id' });
  Order.belongsTo(User, { as: 'seller', foreignKey: 'seller_id' });
  Order.belongsTo(Product, { foreignKey: 'product_id' });
  Order.belongsTo(Market, { foreignKey: 'market_id' });
  Order.hasMany(Transaction, { foreignKey: 'order_id' });

  // Transaction associations
  Transaction.belongsTo(Order, { foreignKey: 'order_id' });
  Transaction.belongsTo(User, { as: 'payer', foreignKey: 'payer_id' });
  Transaction.belongsTo(User, { as: 'payee', foreignKey: 'payee_id' });
  Transaction.belongsTo(User, { as: 'processor', foreignKey: 'processed_by' });
  Transaction.belongsTo(Market, { foreignKey: 'market_id' });
  Transaction.belongsTo(Transaction, { as: 'parentTransaction', foreignKey: 'parent_transaction_id' });
  Transaction.hasMany(Transaction, { as: 'childTransactions', foreignKey: 'parent_transaction_id' });
  Transaction.belongsTo(Wallet, { foreignKey: 'wallet_id' });
  Transaction.belongsTo(EscrowAccount, { foreignKey: 'escrow_account_id' });

  // Expert associations
  Expert.belongsTo(User, { as: 'user', foreignKey: 'user_id', onDelete: 'CASCADE' });
  Expert.belongsTo(User, { as: 'createdByAdmin', foreignKey: 'created_by_admin_id', onDelete: 'RESTRICT' });
  Expert.belongsTo(User, { as: 'approvedByAdmin', foreignKey: 'approved_by_admin_id', onDelete: 'SET NULL' });
  Expert.hasMany(Advisory, { foreignKey: 'expert_id' });
  Expert.hasMany(Consultation, { foreignKey: 'expert_id' });
  Expert.hasMany(ExpertReview, { foreignKey: 'expert_id' });
  Expert.hasOne(Wallet, { foreignKey: 'expert_id' });

  // Wallet associations
  Wallet.belongsTo(User, { as: 'owner', foreignKey: 'user_id' });
  Wallet.hasMany(Transaction, { foreignKey: 'wallet_id' });

  // EscrowAccount associations
  EscrowAccount.belongsTo(Order, { foreignKey: 'order_id' });
  EscrowAccount.belongsTo(User, { as: 'buyer', foreignKey: 'buyer_id' });
  EscrowAccount.belongsTo(User, { as: 'seller', foreignKey: 'seller_id' });
  EscrowAccount.hasMany(Transaction, { foreignKey: 'escrow_account_id' });

  // AuditLog associations
  AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // VoiceCommand associations
  VoiceCommand.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  VoiceCommand.belongsTo(LanguagePack, { foreignKey: 'language_pack_id', as: 'languagePack' });

  // LanguagePack associations
  LanguagePack.hasMany(VoiceCommand, { foreignKey: 'language_pack_id' });
  LanguagePack.hasMany(Translation, { foreignKey: 'language_pack_id' });

  // LanguagePreference associations
  LanguagePreference.belongsTo(User, { foreignKey: 'user_id' });
  LanguagePreference.belongsTo(LanguagePack, { foreignKey: 'language_pack_id' });

  // Consultation associations
  Consultation.belongsTo(Expert, { foreignKey: 'expert_id' });
  Consultation.belongsTo(User, { as: 'farmer', foreignKey: 'farmer_id' });

  // ExpertReview associations
  ExpertReview.belongsTo(Expert, { foreignKey: 'expert_id' });
  ExpertReview.belongsTo(User, { as: 'reviewer', foreignKey: 'reviewer_id' });
  ExpertReview.belongsTo(Consultation, { foreignKey: 'consultation_id' });

  // CommissionTransaction associations
  CommissionTransaction.belongsTo(Transaction, { foreignKey: 'transaction_id' });
  CommissionTransaction.belongsTo(User, { as: 'recipient', foreignKey: 'recipient_id' });

  // MarketProduct associations
  MarketProduct.belongsTo(Market, { foreignKey: 'market_id' });
  MarketProduct.belongsTo(Product, { foreignKey: 'product_id' });

  // PriceHistory associations
  PriceHistory.belongsTo(Product, { foreignKey: 'product_id' });
  PriceHistory.belongsTo(Market, { foreignKey: 'market_id' });

  // WeatherData associations
  WeatherData.belongsTo(Farm, { foreignKey: 'farm_id' });

  // Forum associations
  ForumTopic.hasMany(ForumPost, { foreignKey: 'topic_id', as: 'posts' });
  ForumTopic.belongsTo(User, { as: 'creator', foreignKey: 'created_by_id' });
  ForumPost.belongsTo(ForumTopic, { foreignKey: 'topic_id', as: 'topic' });
  ForumPost.belongsTo(User, { as: 'author', foreignKey: 'author_id' });
  ForumModeration.belongsTo(ForumPost, { foreignKey: 'post_id' });
  ForumModeration.belongsTo(User, { as: 'moderator', foreignKey: 'moderator_id' });

  // Forum Member associations
  ForumMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  ForumMember.belongsTo(ForumTopic, { foreignKey: 'forum_id', as: 'forum' });
  User.hasMany(ForumMember, { foreignKey: 'user_id' });
  ForumTopic.hasMany(ForumMember, { foreignKey: 'forum_id', as: 'members' });

  // Forum Message associations (for chat)
  ForumMessage.belongsTo(User, { foreignKey: 'user_id', as: 'sender' });
  ForumMessage.belongsTo(ForumTopic, { foreignKey: 'forum_id', as: 'forum' });
  ForumTopic.hasMany(ForumMessage, { foreignKey: 'forum_id', as: 'messages' });
  User.hasMany(ForumMessage, { foreignKey: 'user_id', as: 'forumMessages' });

  // Cart associations
  Cart.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Cart.hasMany(CartItem, { foreignKey: 'cart_id', as: 'items', onDelete: 'CASCADE' });
  User.hasMany(Cart, { foreignKey: 'user_id', as: 'carts' });

  // CartItem associations
  CartItem.belongsTo(Cart, { foreignKey: 'cart_id', as: 'cart' });
  CartItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
  Product.hasMany(CartItem, { foreignKey: 'product_id', as: 'cartItems' });
};