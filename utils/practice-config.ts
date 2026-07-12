// 练习模块共享配置 / Shared configuration for the practice module
// 包含难度选项、场景分类数据，以及解析/提示词辅助函数。 / Contains difficulty options, scenario category data, and parsing/prompt helpers.
// 该文件位于项目根 utils/，Nuxt 3 会自动在客户端与服务端同时可用。 / Located at project-root utils/, auto-available on both client and server in Nuxt 3.

// 引入服务端 AI 类型中的语言代码类型 / Import the language-code type from the server AI types
import type { LangCode } from '~/server/types/ai'

// ---------- 难度 / Difficulty ----------

/** 练习难度档位（用户可见）/ Practice difficulty tiers (user-facing) */
export type PracticeDifficulty = 'random' | 'daily' | 'fluent' | 'professional'

// 难度选项的数据结构 / Data structure for a difficulty option
export interface DifficultyOption {
  // 难度值 / The difficulty value
  value: PracticeDifficulty
  // 对应 i18n 文案的 key / The i18n key for its label
  labelKey: string
  // 内部数值难度（1-3）/ Internal numeric difficulty (1-3)
  numeric: 1 | 2 | 3
  // 难度描述文案的 i18n key / The i18n key for its description
  descriptionKey: string
}

/** 难度到内部 numeric 难度的映射 / Map a difficulty tier to its internal numeric difficulty */
export function resolveNumericDifficulty(difficulty: PracticeDifficulty): 1 | 2 | 3 {
  // 根据难度档位返回对应数值 / Return the numeric value based on the tier
  switch (difficulty) {
    // 日常档 → 1 / Daily → 1
    case 'daily':
      return 1
    // 流利档 → 2 / Fluent → 2
    case 'fluent':
      return 2
    // 专业档 → 3 / Professional → 3
    case 'professional':
      return 3
    // 随机档：随机取 1-3 / Random: pick 1-3 at random
    case 'random':
    // 默认兜底 / Default fallback
    default:
      return (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3
  }
}

// 所有可选难度列表 / List of all available difficulty tiers
export const PRACTICE_DIFFICULTIES: PracticeDifficulty[] = [
  'random',
  'daily',
  'fluent',
  'professional',
]

/** 根据目标语言返回难度语言后缀的 i18n key / Return the i18n key for the difficulty language suffix based on target language */
export function difficultyLangKey(targetLang: LangCode): string {
  // 日语用 ja 后缀，其余用 en 后缀 / Japanese uses the ja suffix, others use en
  return targetLang === 'ja' ? 'practice.langJa' : 'practice.langEn'
}

// ---------- 场景 / Scenarios ----------

// 子场景（细分话题）数据结构 / Data structure for a sub-scenario (narrow topic)
export interface ScenarioSub {
  // 子场景 id / Sub-scenario id
  id: string
  // 子场景文案的 i18n key / i18n key for the sub-scenario label
  labelKey: string
}

// 场景大类数据结构 / Data structure for a scenario category
export interface ScenarioCategory {
  // 大类 id / Category id
  id: string
  // 大类文案的 i18n key / i18n key for the category label
  labelKey: string
  // 该大类下的子场景列表 / Sub-scenarios belonging to this category
  subScenarios: ScenarioSub[]
}

// 场景取值（用于请求/校验）/ A scenario value (used in requests/validation)
export interface ScenarioValue {
  // 大类 id，或 'random' 表示随机 / Category id, or 'random' for random
  categoryId: string | 'random'
  // 可选子场景 id / Optional sub-scenario id
  subId?: string
}

/** 随机情景（默认）/ Random scenario (default) */
export const RANDOM_SCENARIO: ScenarioValue = { categoryId: 'random' }

/** 25 个场景大类 / The 25 scenario categories */
export const SCENARIO_CATEGORIES: ScenarioCategory[] = [
  { id: 'dailyLife', labelKey: 'practice.scenario.dailyLife', subScenarios: [ // 日常生活 / Daily Life
    { id: 'dailyRoutine', labelKey: 'practice.scenario.dailyLife_dailyRoutine' }, // 日常作息 / Daily Routine
    { id: 'homeChores', labelKey: 'practice.scenario.dailyLife_homeChores' }, // 家务 / Housework
    { id: 'freeTime', labelKey: 'practice.scenario.dailyLife_freeTime' }, // 闲暇 / Free Time
  ] },
  { id: 'shoppingServices', labelKey: 'practice.scenario.shoppingServices', subScenarios: [ // 购物与服务 / Shopping & Services
    { id: 'inStore', labelKey: 'practice.scenario.shoppingServices_inStore' }, // 店内 / In Store
    { id: 'onlineShopping', labelKey: 'practice.scenario.shoppingServices_onlineShopping' }, // 网购 / Online Shopping
    { id: 'services', labelKey: 'practice.scenario.shoppingServices_services' }, // 服务 / Services
  ] },
  { id: 'foodDining', labelKey: 'practice.scenario.foodDining', subScenarios: [ // 餐饮 / Food & Dining
    { id: 'cafeRestaurant', labelKey: 'practice.scenario.foodDining_cafeRestaurant' }, // 餐厅咖啡 / Cafe & Restaurant
    { id: 'cookingRecipes', labelKey: 'practice.scenario.foodDining_cookingRecipes' }, // 烹饪 / Cooking
  ] },
  { id: 'travelTransport', labelKey: 'practice.scenario.travelTransport', subScenarios: [ // 旅行交通 / Travel & Transport
    { id: 'publicTransport', labelKey: 'practice.scenario.travelTransport_publicTransport' }, // 公共交通 / Public Transport
    { id: 'navigationDirections', labelKey: 'practice.scenario.travelTransport_navigationDirections' }, // 导航 / Navigation
    { id: 'accommodationBooking', labelKey: 'practice.scenario.travelTransport_accommodationBooking' }, // 住宿 / Accommodation
  ] },
  { id: 'studySchool', labelKey: 'practice.scenario.studySchool', subScenarios: [ // 学习校园 / Study & School
    { id: 'classroomInteraction', labelKey: 'practice.scenario.studySchool_classroomInteraction' }, // 课堂 / Classroom
    { id: 'assignmentsExams', labelKey: 'practice.scenario.studySchool_assignmentsExams' }, // 作业考试 / Assignments & Exams
    { id: 'groupWork', labelKey: 'practice.scenario.studySchool_groupWork' }, // 小组 / Group Work
  ] },
  { id: 'workCareer', labelKey: 'practice.scenario.workCareer', subScenarios: [ // 工作职业 / Work & Career
    { id: 'jobHunting', labelKey: 'practice.scenario.workCareer_jobHunting' }, // 求职 / Job Hunting
    { id: 'officeCommunication', labelKey: 'practice.scenario.workCareer_officeCommunication' }, // 办公沟通 / Office Communication
    { id: 'professionalEmails', labelKey: 'practice.scenario.workCareer_professionalEmails' }, // 商务邮件 / Professional Emails
  ] },
  { id: 'socialRelationships', labelKey: 'practice.scenario.socialRelationships', subScenarios: [ // 社交关系 / Social Relationships
    { id: 'makingFriends', labelKey: 'practice.scenario.socialRelationships_makingFriends' }, // 交友 / Making Friends
    { id: 'friendshipFamily', labelKey: 'practice.scenario.socialRelationships_friendshipFamily' }, // 亲友 / Friendship & Family
    { id: 'emotionsMood', labelKey: 'practice.scenario.socialRelationships_emotionsMood' }, // 情绪 / Emotions
  ] },
  { id: 'healthWellness', labelKey: 'practice.scenario.healthWellness', subScenarios: [ // 健康养生 / Health & Wellness
    { id: 'doctorPharmacy', labelKey: 'practice.scenario.healthWellness_doctorPharmacy' }, // 就医 / Doctor & Pharmacy
    { id: 'exerciseHabits', labelKey: 'practice.scenario.healthWellness_exerciseHabits' }, // 锻炼 / Exercise
  ] },
  { id: 'moneyBanking', labelKey: 'practice.scenario.moneyBanking', subScenarios: [ // 金钱银行 / Money & Banking
    { id: 'budgetExpenses', labelKey: 'practice.scenario.moneyBanking_budgetExpenses' }, // 预算 / Budget
    { id: 'bankingFinance', labelKey: 'practice.scenario.moneyBanking_bankingFinance' }, // 金融 / Banking
  ] },
  { id: 'techMedia', labelKey: 'practice.scenario.techMedia', subScenarios: [ // 科技媒体 / Tech & Media
    { id: 'appsDevices', labelKey: 'practice.scenario.techMedia_appsDevices' }, // 应用设备 / Apps & Devices
    { id: 'socialMessaging', labelKey: 'practice.scenario.techMedia_socialMessaging' }, // 社媒 / Social Messaging
    { id: 'newsBooksMedia', labelKey: 'practice.scenario.techMedia_newsBooksMedia' }, // 资讯 / News & Books
  ] },
  { id: 'cityEnvironment', labelKey: 'practice.scenario.cityEnvironment', subScenarios: [ // 城市环境 / City & Environment
    { id: 'cityLiving', labelKey: 'practice.scenario.cityEnvironment_cityLiving' }, // 城市生活 / City Living
    { id: 'environmentSustainability', labelKey: 'practice.scenario.cityEnvironment_environmentSustainability' }, // 环保 / Environment
  ] },
  { id: 'problemsService', labelKey: 'practice.scenario.problemsService', subScenarios: [ // 问题服务 / Problems & Service
    { id: 'makingComplaints', labelKey: 'practice.scenario.problemsService_makingComplaints' }, // 投诉 / Complaints
    { id: 'seekingHelp', labelKey: 'practice.scenario.problemsService_seekingHelp' }, // 求助 / Seeking Help
  ] },
  { id: 'storytelling', labelKey: 'practice.scenario.storytelling', subScenarios: [ // 叙事 / Storytelling
    { id: 'anecdotes', labelKey: 'practice.scenario.storytelling_anecdotes' }, // 轶事 / Anecdotes
    { id: 'lifeEvents', labelKey: 'practice.scenario.storytelling_lifeEvents' }, // 人生事件 / Life Events
  ] },
  { id: 'opinionDiscussion', labelKey: 'practice.scenario.opinionDiscussion', subScenarios: [ // 观点讨论 / Opinion & Discussion
    { id: 'everydayOpinions', labelKey: 'practice.scenario.opinionDiscussion_everydayOpinions' }, // 日常观点 / Everyday Opinions
    { id: 'socialIssues', labelKey: 'practice.scenario.opinionDiscussion_socialIssues' }, // 社会议题 / Social Issues
  ] },
  { id: 'futurePlans', labelKey: 'practice.scenario.futurePlans', subScenarios: [ // 未来计划 / Future Plans
    { id: 'shortTermPlans', labelKey: 'practice.scenario.futurePlans_shortTermPlans' }, // 短期 / Short-term
    { id: 'longTermGoals', labelKey: 'practice.scenario.futurePlans_longTermGoals' }, // 长期 / Long-term
  ] },
  { id: 'cultureFestivals', labelKey: 'practice.scenario.cultureFestivals', subScenarios: [ // 文化节庆 / Culture & Festivals
    { id: 'holidaysFestivals', labelKey: 'practice.scenario.cultureFestivals_holidaysFestivals' }, // 节日 / Holidays
    { id: 'celebrations', labelKey: 'practice.scenario.cultureFestivals_celebrations' }, // 庆祝 / Celebrations
    { id: 'traditionsCustoms', labelKey: 'practice.scenario.cultureFestivals_traditionsCustoms' }, // 传统 / Traditions
  ] },
  { id: 'natureOutdoor', labelKey: 'practice.scenario.natureOutdoor', subScenarios: [ // 自然户外 / Nature & Outdoor
    { id: 'weatherSeasons', labelKey: 'practice.scenario.natureOutdoor_weatherSeasons' }, // 天气季节 / Weather & Seasons
    { id: 'natureCountryside', labelKey: 'practice.scenario.natureOutdoor_natureCountryside' }, // 乡村自然 / Nature & Countryside
    { id: 'outdoorActivities', labelKey: 'practice.scenario.natureOutdoor_outdoorActivities' }, // 户外活动 / Outdoor Activities
  ] },
  { id: 'housingCommunity', labelKey: 'practice.scenario.housingCommunity', subScenarios: [ // 住房社区 / Housing & Community
    { id: 'findingRenting', labelKey: 'practice.scenario.housingCommunity_findingRenting' }, // 租房 / Finding & Renting
    { id: 'homeMaintenance', labelKey: 'practice.scenario.housingCommunity_homeMaintenance' }, // 维修 / Home Maintenance
    { id: 'neighborsCommunity', labelKey: 'practice.scenario.housingCommunity_neighborsCommunity' }, // 邻里 / Neighbors
  ] },
  { id: 'petsAnimals', labelKey: 'practice.scenario.petsAnimals', subScenarios: [ // 宠物动物 / Pets & Animals
    { id: 'petCare', labelKey: 'practice.scenario.petsAnimals_petCare' }, // 宠物照料 / Pet Care
    { id: 'vetServices', labelKey: 'practice.scenario.petsAnimals_vetServices' }, // 兽医 / Vet Services
    { id: 'wildlifeZoos', labelKey: 'practice.scenario.petsAnimals_wildlifeZoos' }, // 野生动物 / Wildlife & Zoos
  ] },
  { id: 'artsCreative', labelKey: 'practice.scenario.artsCreative', subScenarios: [ // 艺术创意 / Arts & Creative
    { id: 'artMusicPerformance', labelKey: 'practice.scenario.artsCreative_artMusicPerformance' }, // 艺术表演 / Art & Music
    { id: 'creativeProjects', labelKey: 'practice.scenario.artsCreative_creativeProjects' }, // 创作 / Creative Projects
    { id: 'gamesCollections', labelKey: 'practice.scenario.artsCreative_gamesCollections' }, // 游戏收藏 / Games & Collections
  ] },
  { id: 'accidentsEmergencies', labelKey: 'practice.scenario.accidentsEmergencies', subScenarios: [ // 意外紧急 / Accidents & Emergencies
    { id: 'minorAccidents', labelKey: 'practice.scenario.accidentsEmergencies_minorAccidents' }, // 小伤 / Minor Accidents
    { id: 'roadSafety', labelKey: 'practice.scenario.accidentsEmergencies_roadSafety' }, // 道路安全 / Road Safety
    { id: 'seriousEmergencies', labelKey: 'practice.scenario.accidentsEmergencies_seriousEmergencies' }, // 严重紧急 / Serious Emergencies
  ] },
  { id: 'scienceFuture', labelKey: 'practice.scenario.scienceFuture', subScenarios: [ // 科学未来 / Science & Future
    { id: 'scienceDiscovery', labelKey: 'practice.scenario.scienceFuture_scienceDiscovery' }, // 科学发现 / Science & Discovery
    { id: 'techModernLife', labelKey: 'practice.scenario.scienceFuture_techModernLife' }, // 科技生活 / Tech & Modern Life
    { id: 'futureInnovation', labelKey: 'practice.scenario.scienceFuture_futureInnovation' }, // 创新 / Future Innovation
  ] },
  { id: 'emotionalIntelligence', labelKey: 'practice.scenario.emotionalIntelligence', subScenarios: [ // 情商 / Emotional Intelligence
    { id: 'selfAwareness', labelKey: 'practice.scenario.emotionalIntelligence_selfAwareness' }, // 自我认知 / Self-awareness
    { id: 'stressManagement', labelKey: 'practice.scenario.emotionalIntelligence_stressManagement' }, // 压力管理 / Stress Management
    { id: 'conflictGrowth', labelKey: 'practice.scenario.emotionalIntelligence_conflictGrowth' }, // 冲突成长 / Conflict & Growth
  ] },
  { id: 'rulesResponsibilities', labelKey: 'practice.scenario.rulesResponsibilities', subScenarios: [ // 规则责任 / Rules & Responsibilities
    { id: 'rulesRegulations', labelKey: 'practice.scenario.rulesResponsibilities_rulesRegulations' }, // 规章 / Rules & Regulations
    { id: 'dutiesObligations', labelKey: 'practice.scenario.rulesResponsibilities_dutiesObligations' }, // 义务 / Duties & Obligations
    { id: 'rightsFairness', labelKey: 'practice.scenario.rulesResponsibilities_rightsFairness' }, // 权利 / Rights & Fairness
  ] },
  { id: 'mediaAdvertising', labelKey: 'practice.scenario.mediaAdvertising', subScenarios: [ // 媒体广告 / Media & Advertising
    { id: 'mediaAdsDaily', labelKey: 'practice.scenario.mediaAdvertising_mediaAdsDaily' }, // 日常广告 / Media & Ads
    { id: 'recommendationsPersuasion', labelKey: 'practice.scenario.mediaAdvertising_recommendationsPersuasion' }, // 推荐说服 / Recommendations & Persuasion
    { id: 'criticalThinking', labelKey: 'practice.scenario.mediaAdvertising_criticalThinking' }, // 批判性思维 / Critical Thinking
  ] },
]

/** 所有场景 id 集合，用于服务端校验 / Set of all scenario category ids, used for server-side validation */
export const SCENARIO_CATEGORY_IDS = new Set(SCENARIO_CATEGORIES.map((c) => c.id))

// 按 id 查找场景大类 / Find a scenario category by its id
export function getScenarioCategory(id: string): ScenarioCategory | undefined {
  // 在场景列表中匹配给定 id / Match the given id within the scenario list
  return SCENARIO_CATEGORIES.find((c) => c.id === id)
}

// 取子场景的 i18n key / Get the i18n key for a sub-scenario
export function getScenarioSubLabelKey(categoryId: string, subId: string): string | undefined {
  // 先取大类，再在其中找子场景的 labelKey / Find the category, then locate the sub-scenario's labelKey
  const cat = getScenarioCategory(categoryId)
  return cat?.subScenarios.find((s) => s.id === subId)?.labelKey
}

/** 生成用于 AI prompt 的场景描述（英文，便于模型理解）/ Build the English scenario description used in the AI prompt */
export function buildScenarioPrompt(scenario: ScenarioValue): string {
  // 随机或缺失大类：返回任意自然话题 / Random or missing category: allow any natural topic
  if (scenario.categoryId === 'random' || !scenario.categoryId) {
    return 'Topic: any natural, real-world topic is acceptable.'
  }

  // 取对应场景大类 / Get the matching scenario category
  const cat = getScenarioCategory(scenario.categoryId)
  // 大类不存在则退化为随机话题 / Fall back to random topic if category missing
  if (!cat) {
    return 'Topic: any natural, real-world topic is acceptable.'
  }

  // 取大类可读名称 / Get the readable category name
  const categoryName = scenarioLabelFallback(cat.labelKey)
  // 无子场景：给出大类范围 / No sub-scenario: describe the broad category
  if (!scenario.subId) {
    return `Topic: the sentence should belong to the broad scenario "${categoryName}". Pick a common sub-topic within it.`
  }

  // 取子场景可读名称 / Get the readable sub-scenario name
  const subLabelKey = getScenarioSubLabelKey(scenario.categoryId, scenario.subId)
  const subName = subLabelKey ? scenarioLabelFallback(subLabelKey) : scenario.subId
  // 返回含大类与子场景的具体话题描述 / Return a concrete topic scoped to category and sub-scenario
  return `Topic: the sentence should fit the scenario "${categoryName} - ${subName}".`
}

/** 兜底：若 i18n 未命中，从 labelKey 提取可读文本（仅用于服务端 prompt）/ Fallback: extract readable text from labelKey when i18n misses (server prompt only) */
function scenarioLabelFallback(labelKey: string): string {
  // labelKey 到英文可读文本的映射表 / Map from labelKey to human-readable English text
  const map: Record<string, string> = {
    'practice.scenario.dailyLife': 'Daily Life & Routine', // 日常生活 / Daily Life
    'practice.scenario.dailyLife_dailyRoutine': 'Daily Routine (morning/evening)', // 日常作息 / Daily Routine
    'practice.scenario.dailyLife_homeChores': 'At Home & Housework', // 家务 / Housework
    'practice.scenario.dailyLife_freeTime': 'Free Time & Hobbies', // 闲暇 / Free Time
    'practice.scenario.shoppingServices': 'Shopping & Daily Services', // 购物服务 / Shopping & Services
    'practice.scenario.shoppingServices_inStore': 'At the Supermarket / Small Shop', // 店内 / In Store
    'practice.scenario.shoppingServices_onlineShopping': 'Online Shopping', // 网购 / Online Shopping
    'practice.scenario.shoppingServices_services': 'Services: Hairdresser, Post Office, Repairs', // 服务 / Services
    'practice.scenario.foodDining': 'Food, Dining Out & Cooking', // 餐饮 / Food & Dining
    'practice.scenario.foodDining_cafeRestaurant': 'At a Cafe / Restaurant', // 餐厅 / Cafe & Restaurant
    'practice.scenario.foodDining_cookingRecipes': 'Cooking & Recipes', // 烹饪 / Cooking
    'practice.scenario.travelTransport': 'Travel, Transport & Directions', // 旅行交通 / Travel & Transport
    'practice.scenario.travelTransport_publicTransport': 'Public Transport', // 公共交通 / Public Transport
    'practice.scenario.travelTransport_navigationDirections': 'City Navigation & Directions', // 导航 / Navigation
    'practice.scenario.travelTransport_accommodationBooking': 'Booking Accommodation & Staying There', // 住宿 / Accommodation
    'practice.scenario.studySchool': 'Study, School & University Life', // 学习校园 / Study & School
    'practice.scenario.studySchool_classroomInteraction': 'Classroom Interaction', // 课堂 / Classroom
    'practice.scenario.studySchool_assignmentsExams': 'Assignments & Exams', // 作业考试 / Assignments & Exams
    'practice.scenario.studySchool_groupWork': 'Group Work', // 小组 / Group Work
    'practice.scenario.workCareer': 'Work, Career & Professional Life', // 工作职业 / Work & Career
    'practice.scenario.workCareer_jobHunting': 'Job Applications & Interviews', // 求职 / Job Hunting
    'practice.scenario.workCareer_officeCommunication': 'Office Communication', // 办公沟通 / Office Communication
    'practice.scenario.workCareer_professionalEmails': 'Professional Emails & Messages', // 商务邮件 / Professional Emails
    'practice.scenario.socialRelationships': 'Social Life, Relationships & Emotions', // 社交关系 / Social Relationships
    'practice.scenario.socialRelationships_makingFriends': 'Making New Friends & Small Talk', // 交友 / Making Friends
    'practice.scenario.socialRelationships_friendshipFamily': 'Friendship & Family', // 亲友 / Friendship & Family
    'practice.scenario.socialRelationships_emotionsMood': 'Emotions & Mental State', // 情绪 / Emotions
    'practice.scenario.healthWellness': 'Health, Lifestyle & Well-being', // 健康养生 / Health & Wellness
    'practice.scenario.healthWellness_doctorPharmacy': "At the Doctor's / Pharmacy", // 就医 / Doctor & Pharmacy
    'practice.scenario.healthWellness_exerciseHabits': 'Exercise & Healthy Habits', // 锻炼 / Exercise
    'practice.scenario.moneyBanking': 'Money, Banking & Consumer Life', // 金钱银行 / Money & Banking
    'practice.scenario.moneyBanking_budgetExpenses': 'Personal Budget & Daily Expenses', // 预算 / Budget
    'practice.scenario.moneyBanking_bankingFinance': 'Banking & Financial Services', // 金融 / Banking
    'practice.scenario.techMedia': 'Technology, Digital Life & Media', // 科技媒体 / Tech & Media
    'practice.scenario.techMedia_appsDevices': 'Using Apps & Devices', // 应用设备 / Apps & Devices
    'practice.scenario.techMedia_socialMessaging': 'Social Media & Messaging', // 社媒 / Social Messaging
    'practice.scenario.techMedia_newsBooksMedia': 'News, TV, Movies & Books', // 资讯 / News & Books
    'practice.scenario.cityEnvironment': 'City, Environment & Public Life', // 城市环境 / City & Environment
    'practice.scenario.cityEnvironment_cityLiving': 'City Life', // 城市生活 / City Living
    'practice.scenario.cityEnvironment_environmentSustainability': 'Environment & Sustainability', // 环保 / Environment
    'practice.scenario.problemsService': 'Problem Solving, Complaints & Customer Service', // 问题服务 / Problems & Service
    'practice.scenario.problemsService_makingComplaints': 'Making a Complaint', // 投诉 / Complaints
    'practice.scenario.problemsService_seekingHelp': 'Seeking Help in Difficult Situations', // 求助 / Seeking Help
    'practice.scenario.storytelling': 'Storytelling & Past Experiences', // 叙事 / Storytelling
    'practice.scenario.storytelling_anecdotes': 'Anecdotes & Fun Stories', // 轶事 / Anecdotes
    'practice.scenario.storytelling_lifeEvents': 'Important Life Events', // 人生事件 / Life Events
    'practice.scenario.opinionDiscussion': 'Opinions, Discussions & Abstract Topics', // 观点讨论 / Opinion & Discussion
    'practice.scenario.opinionDiscussion_everydayOpinions': 'Everyday Opinion Topics', // 日常观点 / Everyday Opinions
    'practice.scenario.opinionDiscussion_socialIssues': 'Social Issues (safe, common, non-extreme)', // 社会议题 / Social Issues
    'practice.scenario.futurePlans': 'Future Plans, Hopes & Hypotheticals', // 未来计划 / Future Plans
    'practice.scenario.futurePlans_shortTermPlans': 'Short-term Plans', // 短期 / Short-term
    'practice.scenario.futurePlans_longTermGoals': 'Long-term Goals & Dreams', // 长期 / Long-term
    'practice.scenario.cultureFestivals': 'Culture, Festivals & Celebrations', // 文化节庆 / Culture & Festivals
    'practice.scenario.cultureFestivals_holidaysFestivals': 'Holidays & Festivals', // 节日 / Holidays
    'practice.scenario.cultureFestivals_celebrations': 'Celebrations: Birthdays, Weddings & Special Days', // 庆祝 / Celebrations
    'practice.scenario.cultureFestivals_traditionsCustoms': 'Traditions & Cultural Differences', // 传统 / Traditions
    'practice.scenario.natureOutdoor': 'Nature, Weather & Outdoor Activities', // 自然户外 / Nature & Outdoor
    'practice.scenario.natureOutdoor_weatherSeasons': 'Weather & Seasons', // 天气季节 / Weather & Seasons
    'practice.scenario.natureOutdoor_natureCountryside': 'Nature & Countryside', // 乡村自然 / Nature & Countryside
    'practice.scenario.natureOutdoor_outdoorActivities': 'Outdoor Activities & Sports', // 户外活动 / Outdoor Activities
    'practice.scenario.housingCommunity': 'Housing, Community & Moving', // 住房社区 / Housing & Community
    'practice.scenario.housingCommunity_findingRenting': 'Finding & Renting a Place', // 租房 / Finding & Renting
    'practice.scenario.housingCommunity_homeMaintenance': 'Home Problems & Maintenance', // 维修 / Home Maintenance
    'practice.scenario.housingCommunity_neighborsCommunity': 'Neighbors & Community', // 邻里 / Neighbors
    'practice.scenario.petsAnimals': 'Pets, Animals & Wildlife', // 宠物动物 / Pets & Animals
    'practice.scenario.petsAnimals_petCare': 'Pets & Daily Animal Care', // 宠物照料 / Pet Care
    'practice.scenario.petsAnimals_vetServices': "At the Vet's / Animal Services", // 兽医 / Vet Services
    'practice.scenario.petsAnimals_wildlifeZoos': 'Wildlife, Zoos & Animal Protection', // 野生动物 / Wildlife & Zoos
    'practice.scenario.artsCreative': 'Art, Creativity & Hobbies', // 艺术创意 / Arts & Creative
    'practice.scenario.artsCreative_artMusicPerformance': 'Art, Music & Performance', // 艺术表演 / Art & Music
    'practice.scenario.artsCreative_creativeProjects': 'Creative Projects & Crafts', // 创作 / Creative Projects
    'practice.scenario.artsCreative_gamesCollections': 'Games, Collecting & Other Hobbies', // 游戏收藏 / Games & Collections
    'practice.scenario.accidentsEmergencies': 'Accidents, Safety & Emergencies', // 意外紧急 / Accidents & Emergencies
    'practice.scenario.accidentsEmergencies_minorAccidents': 'Minor Accidents & Injuries', // 小伤 / Minor Accidents
    'practice.scenario.accidentsEmergencies_roadSafety': 'Road Safety & Traffic Accidents', // 道路安全 / Road Safety
    'practice.scenario.accidentsEmergencies_seriousEmergencies': 'Serious Emergencies & Calling for Help', // 严重紧急 / Serious Emergencies
    'practice.scenario.scienceFuture': 'Science, Technology & The Future', // 科学未来 / Science & Future
    'practice.scenario.scienceFuture_scienceDiscovery': 'Science & Discovery', // 科学发现 / Science & Discovery
    'practice.scenario.scienceFuture_techModernLife': 'Technology & Modern Life (Advanced)', // 科技生活 / Tech & Modern Life
    'practice.scenario.scienceFuture_futureInnovation': 'Future, Change & Innovation', // 创新 / Future Innovation
    'practice.scenario.emotionalIntelligence': 'Emotional Intelligence & Self-Reflection', // 情商 / Emotional Intelligence
    'practice.scenario.emotionalIntelligence_selfAwareness': 'Understanding Yourself', // 自我认知 / Self-awareness
    'practice.scenario.emotionalIntelligence_stressManagement': 'Emotions & Stress Management', // 压力管理 / Stress Management
    'practice.scenario.emotionalIntelligence_conflictGrowth': 'Relationships, Conflict & Growth', // 冲突成长 / Conflict & Growth
    'practice.scenario.rulesResponsibilities': 'Rules, Responsibilities & Rights', // 规则责任 / Rules & Responsibilities
    'practice.scenario.rulesResponsibilities_rulesRegulations': 'Rules & Regulations (school, workplace, public)', // 规章 / Rules
    'practice.scenario.rulesResponsibilities_dutiesObligations': 'Duties & Obligations', // 义务 / Duties
    'practice.scenario.rulesResponsibilities_rightsFairness': 'Rights, Fairness & Respect', // 权利 / Rights
    'practice.scenario.mediaAdvertising': 'Media, Advertising & Persuasion', // 媒体广告 / Media & Advertising
    'practice.scenario.mediaAdvertising_mediaAdsDaily': 'Media & Advertising in Daily Life', // 日常广告 / Media & Ads
    'practice.scenario.mediaAdvertising_recommendationsPersuasion': 'Recommendations, Suggestions & Persuasion (Daily Life)', // 推荐说服 / Persuasion
    'practice.scenario.mediaAdvertising_criticalThinking': 'Critical Thinking, Opinions & Influence', // 批判思维 / Critical Thinking
  }
  // 命中则返回映射文本，否则回退为原始 labelKey / Return mapped text or fall back to the raw labelKey
  return map[labelKey] ?? labelKey
}

/** 校验前端传来的 scenario 是否合法 / Validate that a scenario sent from the client is legal */
export function validateScenario(value: unknown): ScenarioValue {
  // 非对象或为空则视为随机 / Not an object or empty → treat as random
  if (!value || typeof value !== 'object') return RANDOM_SCENARIO
  // 解构出 categoryId 与 subId / Destructure categoryId and subId
  const { categoryId, subId } = value as Partial<ScenarioValue>

  // 缺失或为 random 则视为随机 / Missing or 'random' → random
  if (!categoryId || categoryId === 'random') return RANDOM_SCENARIO
  // 不在已知集合中则视为随机 / Unknown id → random
  if (!SCENARIO_CATEGORY_IDS.has(categoryId)) return RANDOM_SCENARIO

  // 取对应大类 / Get the matching category
  const cat = getScenarioCategory(categoryId)
  // 大类不存在则视为随机 / Category missing → random
  if (!cat) return RANDOM_SCENARIO

  // 无子场景：返回仅含大类的合法值 / No sub-id: return a value with only the category
  if (!subId) return { categoryId }
  // 子场景合法：返回含子场景的值 / Valid sub-id: return value including sub-id
  if (cat.subScenarios.some((s) => s.id === subId)) {
    return { categoryId, subId }
  }
  // 子场景非法：退化为仅含大类 / Invalid sub-id: fall back to category only
  return { categoryId }
}