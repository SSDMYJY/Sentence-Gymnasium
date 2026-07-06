// 练习模块共享配置
// 包含难度选项、场景分类数据，以及解析/提示词辅助函数。
// 该文件位于项目根 utils/，Nuxt 3 会自动在客户端与服务端同时可用。

import type { LangCode } from '~/server/types/ai'

// ---------- 难度 ----------

/** 练习难度档位（用户可见） */
export type PracticeDifficulty = 'random' | 'daily' | 'fluent' | 'professional'

export interface DifficultyOption {
  value: PracticeDifficulty
  labelKey: string
  numeric: 1 | 2 | 3
  descriptionKey: string
}

/** 难度到内部 numeric 难度的映射 */
export function resolveNumericDifficulty(difficulty: PracticeDifficulty): 1 | 2 | 3 {
  switch (difficulty) {
    case 'daily':
      return 1
    case 'fluent':
      return 2
    case 'professional':
      return 3
    case 'random':
    default:
      return (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3
  }
}

export const PRACTICE_DIFFICULTIES: PracticeDifficulty[] = [
  'random',
  'daily',
  'fluent',
  'professional',
]

/** 根据目标语言返回难度语言后缀的 i18n key */
export function difficultyLangKey(targetLang: LangCode): string {
  return targetLang === 'ja' ? 'practice.langJa' : 'practice.langEn'
}

// ---------- 场景 ----------

export interface ScenarioSub {
  id: string
  labelKey: string
}

export interface ScenarioCategory {
  id: string
  labelKey: string
  subScenarios: ScenarioSub[]
}

export interface ScenarioValue {
  categoryId: string | 'random'
  subId?: string
}

/** 随机情景（默认） */
export const RANDOM_SCENARIO: ScenarioValue = { categoryId: 'random' }

/** 25 个场景大类 */
export const SCENARIO_CATEGORIES: ScenarioCategory[] = [
  {
    id: 'dailyLife',
    labelKey: 'practice.scenario.dailyLife',
    subScenarios: [
      { id: 'dailyRoutine', labelKey: 'practice.scenario.dailyLife_dailyRoutine' },
      { id: 'homeChores', labelKey: 'practice.scenario.dailyLife_homeChores' },
      { id: 'freeTime', labelKey: 'practice.scenario.dailyLife_freeTime' },
    ],
  },
  {
    id: 'shoppingServices',
    labelKey: 'practice.scenario.shoppingServices',
    subScenarios: [
      { id: 'inStore', labelKey: 'practice.scenario.shoppingServices_inStore' },
      { id: 'onlineShopping', labelKey: 'practice.scenario.shoppingServices_onlineShopping' },
      { id: 'services', labelKey: 'practice.scenario.shoppingServices_services' },
    ],
  },
  {
    id: 'foodDining',
    labelKey: 'practice.scenario.foodDining',
    subScenarios: [
      { id: 'cafeRestaurant', labelKey: 'practice.scenario.foodDining_cafeRestaurant' },
      { id: 'cookingRecipes', labelKey: 'practice.scenario.foodDining_cookingRecipes' },
    ],
  },
  {
    id: 'travelTransport',
    labelKey: 'practice.scenario.travelTransport',
    subScenarios: [
      { id: 'publicTransport', labelKey: 'practice.scenario.travelTransport_publicTransport' },
      { id: 'navigationDirections', labelKey: 'practice.scenario.travelTransport_navigationDirections' },
      { id: 'accommodationBooking', labelKey: 'practice.scenario.travelTransport_accommodationBooking' },
    ],
  },
  {
    id: 'studySchool',
    labelKey: 'practice.scenario.studySchool',
    subScenarios: [
      { id: 'classroomInteraction', labelKey: 'practice.scenario.studySchool_classroomInteraction' },
      { id: 'assignmentsExams', labelKey: 'practice.scenario.studySchool_assignmentsExams' },
      { id: 'groupWork', labelKey: 'practice.scenario.studySchool_groupWork' },
    ],
  },
  {
    id: 'workCareer',
    labelKey: 'practice.scenario.workCareer',
    subScenarios: [
      { id: 'jobHunting', labelKey: 'practice.scenario.workCareer_jobHunting' },
      { id: 'officeCommunication', labelKey: 'practice.scenario.workCareer_officeCommunication' },
      { id: 'professionalEmails', labelKey: 'practice.scenario.workCareer_professionalEmails' },
    ],
  },
  {
    id: 'socialRelationships',
    labelKey: 'practice.scenario.socialRelationships',
    subScenarios: [
      { id: 'makingFriends', labelKey: 'practice.scenario.socialRelationships_makingFriends' },
      { id: 'friendshipFamily', labelKey: 'practice.scenario.socialRelationships_friendshipFamily' },
      { id: 'emotionsMood', labelKey: 'practice.scenario.socialRelationships_emotionsMood' },
    ],
  },
  {
    id: 'healthWellness',
    labelKey: 'practice.scenario.healthWellness',
    subScenarios: [
      { id: 'doctorPharmacy', labelKey: 'practice.scenario.healthWellness_doctorPharmacy' },
      { id: 'exerciseHabits', labelKey: 'practice.scenario.healthWellness_exerciseHabits' },
    ],
  },
  {
    id: 'moneyBanking',
    labelKey: 'practice.scenario.moneyBanking',
    subScenarios: [
      { id: 'budgetExpenses', labelKey: 'practice.scenario.moneyBanking_budgetExpenses' },
      { id: 'bankingFinance', labelKey: 'practice.scenario.moneyBanking_bankingFinance' },
    ],
  },
  {
    id: 'techMedia',
    labelKey: 'practice.scenario.techMedia',
    subScenarios: [
      { id: 'appsDevices', labelKey: 'practice.scenario.techMedia_appsDevices' },
      { id: 'socialMessaging', labelKey: 'practice.scenario.techMedia_socialMessaging' },
      { id: 'newsBooksMedia', labelKey: 'practice.scenario.techMedia_newsBooksMedia' },
    ],
  },
  {
    id: 'cityEnvironment',
    labelKey: 'practice.scenario.cityEnvironment',
    subScenarios: [
      { id: 'cityLiving', labelKey: 'practice.scenario.cityEnvironment_cityLiving' },
      { id: 'environmentSustainability', labelKey: 'practice.scenario.cityEnvironment_environmentSustainability' },
    ],
  },
  {
    id: 'problemsService',
    labelKey: 'practice.scenario.problemsService',
    subScenarios: [
      { id: 'makingComplaints', labelKey: 'practice.scenario.problemsService_makingComplaints' },
      { id: 'seekingHelp', labelKey: 'practice.scenario.problemsService_seekingHelp' },
    ],
  },
  {
    id: 'storytelling',
    labelKey: 'practice.scenario.storytelling',
    subScenarios: [
      { id: 'anecdotes', labelKey: 'practice.scenario.storytelling_anecdotes' },
      { id: 'lifeEvents', labelKey: 'practice.scenario.storytelling_lifeEvents' },
    ],
  },
  {
    id: 'opinionDiscussion',
    labelKey: 'practice.scenario.opinionDiscussion',
    subScenarios: [
      { id: 'everydayOpinions', labelKey: 'practice.scenario.opinionDiscussion_everydayOpinions' },
      { id: 'socialIssues', labelKey: 'practice.scenario.opinionDiscussion_socialIssues' },
    ],
  },
  {
    id: 'futurePlans',
    labelKey: 'practice.scenario.futurePlans',
    subScenarios: [
      { id: 'shortTermPlans', labelKey: 'practice.scenario.futurePlans_shortTermPlans' },
      { id: 'longTermGoals', labelKey: 'practice.scenario.futurePlans_longTermGoals' },
    ],
  },
  {
    id: 'cultureFestivals',
    labelKey: 'practice.scenario.cultureFestivals',
    subScenarios: [
      { id: 'holidaysFestivals', labelKey: 'practice.scenario.cultureFestivals_holidaysFestivals' },
      { id: 'celebrations', labelKey: 'practice.scenario.cultureFestivals_celebrations' },
      { id: 'traditionsCustoms', labelKey: 'practice.scenario.cultureFestivals_traditionsCustoms' },
    ],
  },
  {
    id: 'natureOutdoor',
    labelKey: 'practice.scenario.natureOutdoor',
    subScenarios: [
      { id: 'weatherSeasons', labelKey: 'practice.scenario.natureOutdoor_weatherSeasons' },
      { id: 'natureCountryside', labelKey: 'practice.scenario.natureOutdoor_natureCountryside' },
      { id: 'outdoorActivities', labelKey: 'practice.scenario.natureOutdoor_outdoorActivities' },
    ],
  },
  {
    id: 'housingCommunity',
    labelKey: 'practice.scenario.housingCommunity',
    subScenarios: [
      { id: 'findingRenting', labelKey: 'practice.scenario.housingCommunity_findingRenting' },
      { id: 'homeMaintenance', labelKey: 'practice.scenario.housingCommunity_homeMaintenance' },
      { id: 'neighborsCommunity', labelKey: 'practice.scenario.housingCommunity_neighborsCommunity' },
    ],
  },
  {
    id: 'petsAnimals',
    labelKey: 'practice.scenario.petsAnimals',
    subScenarios: [
      { id: 'petCare', labelKey: 'practice.scenario.petsAnimals_petCare' },
      { id: 'vetServices', labelKey: 'practice.scenario.petsAnimals_vetServices' },
      { id: 'wildlifeZoos', labelKey: 'practice.scenario.petsAnimals_wildlifeZoos' },
    ],
  },
  {
    id: 'artsCreative',
    labelKey: 'practice.scenario.artsCreative',
    subScenarios: [
      { id: 'artMusicPerformance', labelKey: 'practice.scenario.artsCreative_artMusicPerformance' },
      { id: 'creativeProjects', labelKey: 'practice.scenario.artsCreative_creativeProjects' },
      { id: 'gamesCollections', labelKey: 'practice.scenario.artsCreative_gamesCollections' },
    ],
  },
  {
    id: 'accidentsEmergencies',
    labelKey: 'practice.scenario.accidentsEmergencies',
    subScenarios: [
      { id: 'minorAccidents', labelKey: 'practice.scenario.accidentsEmergencies_minorAccidents' },
      { id: 'roadSafety', labelKey: 'practice.scenario.accidentsEmergencies_roadSafety' },
      { id: 'seriousEmergencies', labelKey: 'practice.scenario.accidentsEmergencies_seriousEmergencies' },
    ],
  },
  {
    id: 'scienceFuture',
    labelKey: 'practice.scenario.scienceFuture',
    subScenarios: [
      { id: 'scienceDiscovery', labelKey: 'practice.scenario.scienceFuture_scienceDiscovery' },
      { id: 'techModernLife', labelKey: 'practice.scenario.scienceFuture_techModernLife' },
      { id: 'futureInnovation', labelKey: 'practice.scenario.scienceFuture_futureInnovation' },
    ],
  },
  {
    id: 'emotionalIntelligence',
    labelKey: 'practice.scenario.emotionalIntelligence',
    subScenarios: [
      { id: 'selfAwareness', labelKey: 'practice.scenario.emotionalIntelligence_selfAwareness' },
      { id: 'stressManagement', labelKey: 'practice.scenario.emotionalIntelligence_stressManagement' },
      { id: 'conflictGrowth', labelKey: 'practice.scenario.emotionalIntelligence_conflictGrowth' },
    ],
  },
  {
    id: 'rulesResponsibilities',
    labelKey: 'practice.scenario.rulesResponsibilities',
    subScenarios: [
      { id: 'rulesRegulations', labelKey: 'practice.scenario.rulesResponsibilities_rulesRegulations' },
      { id: 'dutiesObligations', labelKey: 'practice.scenario.rulesResponsibilities_dutiesObligations' },
      { id: 'rightsFairness', labelKey: 'practice.scenario.rulesResponsibilities_rightsFairness' },
    ],
  },
  {
    id: 'mediaAdvertising',
    labelKey: 'practice.scenario.mediaAdvertising',
    subScenarios: [
      { id: 'mediaAdsDaily', labelKey: 'practice.scenario.mediaAdvertising_mediaAdsDaily' },
      { id: 'recommendationsPersuasion', labelKey: 'practice.scenario.mediaAdvertising_recommendationsPersuasion' },
      { id: 'criticalThinking', labelKey: 'practice.scenario.mediaAdvertising_criticalThinking' },
    ],
  },
]

/** 所有场景 id 集合，用于服务端校验 */
export const SCENARIO_CATEGORY_IDS = new Set(SCENARIO_CATEGORIES.map((c) => c.id))

export function getScenarioCategory(id: string): ScenarioCategory | undefined {
  return SCENARIO_CATEGORIES.find((c) => c.id === id)
}

export function getScenarioSubLabelKey(categoryId: string, subId: string): string | undefined {
  const cat = getScenarioCategory(categoryId)
  return cat?.subScenarios.find((s) => s.id === subId)?.labelKey
}

/** 生成用于 AI prompt 的场景描述（英文，便于模型理解） */
export function buildScenarioPrompt(scenario: ScenarioValue): string {
  if (scenario.categoryId === 'random' || !scenario.categoryId) {
    return 'Topic: any natural, real-world topic is acceptable.'
  }

  const cat = getScenarioCategory(scenario.categoryId)
  if (!cat) {
    return 'Topic: any natural, real-world topic is acceptable.'
  }

  const categoryName = scenarioLabelFallback(cat.labelKey)
  if (!scenario.subId) {
    return `Topic: the sentence should belong to the broad scenario "${categoryName}". Pick a common sub-topic within it.`
  }

  const subLabelKey = getScenarioSubLabelKey(scenario.categoryId, scenario.subId)
  const subName = subLabelKey ? scenarioLabelFallback(subLabelKey) : scenario.subId
  return `Topic: the sentence should fit the scenario "${categoryName} - ${subName}".`
}

/** 兜底：若 i18n 未命中，从 labelKey 提取可读文本（仅用于服务端 prompt） */
function scenarioLabelFallback(labelKey: string): string {
  const map: Record<string, string> = {
    'practice.scenario.dailyLife': 'Daily Life & Routine',
    'practice.scenario.dailyLife_dailyRoutine': 'Daily Routine (morning/evening)',
    'practice.scenario.dailyLife_homeChores': 'At Home & Housework',
    'practice.scenario.dailyLife_freeTime': 'Free Time & Hobbies',
    'practice.scenario.shoppingServices': 'Shopping & Daily Services',
    'practice.scenario.shoppingServices_inStore': 'At the Supermarket / Small Shop',
    'practice.scenario.shoppingServices_onlineShopping': 'Online Shopping',
    'practice.scenario.shoppingServices_services': 'Services: Hairdresser, Post Office, Repairs',
    'practice.scenario.foodDining': 'Food, Dining Out & Cooking',
    'practice.scenario.foodDining_cafeRestaurant': 'At a Cafe / Restaurant',
    'practice.scenario.foodDining_cookingRecipes': 'Cooking & Recipes',
    'practice.scenario.travelTransport': 'Travel, Transport & Directions',
    'practice.scenario.travelTransport_publicTransport': 'Public Transport',
    'practice.scenario.travelTransport_navigationDirections': 'City Navigation & Directions',
    'practice.scenario.travelTransport_accommodationBooking': 'Booking Accommodation & Staying There',
    'practice.scenario.studySchool': 'Study, School & University Life',
    'practice.scenario.studySchool_classroomInteraction': 'Classroom Interaction',
    'practice.scenario.studySchool_assignmentsExams': 'Assignments & Exams',
    'practice.scenario.studySchool_groupWork': 'Group Work',
    'practice.scenario.workCareer': 'Work, Career & Professional Life',
    'practice.scenario.workCareer_jobHunting': 'Job Applications & Interviews',
    'practice.scenario.workCareer_officeCommunication': 'Office Communication',
    'practice.scenario.workCareer_professionalEmails': 'Professional Emails & Messages',
    'practice.scenario.socialRelationships': 'Social Life, Relationships & Emotions',
    'practice.scenario.socialRelationships_makingFriends': 'Making New Friends & Small Talk',
    'practice.scenario.socialRelationships_friendshipFamily': 'Friendship & Family',
    'practice.scenario.socialRelationships_emotionsMood': 'Emotions & Mental State',
    'practice.scenario.healthWellness': 'Health, Lifestyle & Well-being',
    'practice.scenario.healthWellness_doctorPharmacy': "At the Doctor's / Pharmacy",
    'practice.scenario.healthWellness_exerciseHabits': 'Exercise & Healthy Habits',
    'practice.scenario.moneyBanking': 'Money, Banking & Consumer Life',
    'practice.scenario.moneyBanking_budgetExpenses': 'Personal Budget & Daily Expenses',
    'practice.scenario.moneyBanking_bankingFinance': 'Banking & Financial Services',
    'practice.scenario.techMedia': 'Technology, Digital Life & Media',
    'practice.scenario.techMedia_appsDevices': 'Using Apps & Devices',
    'practice.scenario.techMedia_socialMessaging': 'Social Media & Messaging',
    'practice.scenario.techMedia_newsBooksMedia': 'News, TV, Movies & Books',
    'practice.scenario.cityEnvironment': 'City, Environment & Public Life',
    'practice.scenario.cityEnvironment_cityLiving': 'City Life',
    'practice.scenario.cityEnvironment_environmentSustainability': 'Environment & Sustainability',
    'practice.scenario.problemsService': 'Problem Solving, Complaints & Customer Service',
    'practice.scenario.problemsService_makingComplaints': 'Making a Complaint',
    'practice.scenario.problemsService_seekingHelp': 'Seeking Help in Difficult Situations',
    'practice.scenario.storytelling': 'Storytelling & Past Experiences',
    'practice.scenario.storytelling_anecdotes': 'Anecdotes & Fun Stories',
    'practice.scenario.storytelling_lifeEvents': 'Important Life Events',
    'practice.scenario.opinionDiscussion': 'Opinions, Discussions & Abstract Topics',
    'practice.scenario.opinionDiscussion_everydayOpinions': 'Everyday Opinion Topics',
    'practice.scenario.opinionDiscussion_socialIssues': 'Social Issues (safe, common, non-extreme)',
    'practice.scenario.futurePlans': 'Future Plans, Hopes & Hypotheticals',
    'practice.scenario.futurePlans_shortTermPlans': 'Short-term Plans',
    'practice.scenario.futurePlans_longTermGoals': 'Long-term Goals & Dreams',
    'practice.scenario.cultureFestivals': 'Culture, Festivals & Celebrations',
    'practice.scenario.cultureFestivals_holidaysFestivals': 'Holidays & Festivals',
    'practice.scenario.cultureFestivals_celebrations': 'Celebrations: Birthdays, Weddings & Special Days',
    'practice.scenario.cultureFestivals_traditionsCustoms': 'Traditions & Cultural Differences',
    'practice.scenario.natureOutdoor': 'Nature, Weather & Outdoor Activities',
    'practice.scenario.natureOutdoor_weatherSeasons': 'Weather & Seasons',
    'practice.scenario.natureOutdoor_natureCountryside': 'Nature & Countryside',
    'practice.scenario.natureOutdoor_outdoorActivities': 'Outdoor Activities & Sports',
    'practice.scenario.housingCommunity': 'Housing, Community & Moving',
    'practice.scenario.housingCommunity_findingRenting': 'Finding & Renting a Place',
    'practice.scenario.housingCommunity_homeMaintenance': 'Home Problems & Maintenance',
    'practice.scenario.housingCommunity_neighborsCommunity': 'Neighbors & Community',
    'practice.scenario.petsAnimals': 'Pets, Animals & Wildlife',
    'practice.scenario.petsAnimals_petCare': 'Pets & Daily Animal Care',
    'practice.scenario.petsAnimals_vetServices': "At the Vet's / Animal Services",
    'practice.scenario.petsAnimals_wildlifeZoos': 'Wildlife, Zoos & Animal Protection',
    'practice.scenario.artsCreative': 'Art, Creativity & Hobbies',
    'practice.scenario.artsCreative_artMusicPerformance': 'Art, Music & Performance',
    'practice.scenario.artsCreative_creativeProjects': 'Creative Projects & Crafts',
    'practice.scenario.artsCreative_gamesCollections': 'Games, Collecting & Other Hobbies',
    'practice.scenario.accidentsEmergencies': 'Accidents, Safety & Emergencies',
    'practice.scenario.accidentsEmergencies_minorAccidents': 'Minor Accidents & Injuries',
    'practice.scenario.accidentsEmergencies_roadSafety': 'Road Safety & Traffic Accidents',
    'practice.scenario.accidentsEmergencies_seriousEmergencies': 'Serious Emergencies & Calling for Help',
    'practice.scenario.scienceFuture': 'Science, Technology & The Future',
    'practice.scenario.scienceFuture_scienceDiscovery': 'Science & Discovery',
    'practice.scenario.scienceFuture_techModernLife': 'Technology & Modern Life (Advanced)',
    'practice.scenario.scienceFuture_futureInnovation': 'Future, Change & Innovation',
    'practice.scenario.emotionalIntelligence': 'Emotional Intelligence & Self-Reflection',
    'practice.scenario.emotionalIntelligence_selfAwareness': 'Understanding Yourself',
    'practice.scenario.emotionalIntelligence_stressManagement': 'Emotions & Stress Management',
    'practice.scenario.emotionalIntelligence_conflictGrowth': 'Relationships, Conflict & Growth',
    'practice.scenario.rulesResponsibilities': 'Rules, Responsibilities & Rights',
    'practice.scenario.rulesResponsibilities_rulesRegulations': 'Rules & Regulations (school, workplace, public)',
    'practice.scenario.rulesResponsibilities_dutiesObligations': 'Duties & Obligations',
    'practice.scenario.rulesResponsibilities_rightsFairness': 'Rights, Fairness & Respect',
    'practice.scenario.mediaAdvertising': 'Media, Advertising & Persuasion',
    'practice.scenario.mediaAdvertising_mediaAdsDaily': 'Media & Advertising in Daily Life',
    'practice.scenario.mediaAdvertising_recommendationsPersuasion': 'Recommendations, Suggestions & Persuasion (Daily Life)',
    'practice.scenario.mediaAdvertising_criticalThinking': 'Critical Thinking, Opinions & Influence',
  }
  return map[labelKey] ?? labelKey
}

/** 校验前端传来的 scenario 是否合法 */
export function validateScenario(value: unknown): ScenarioValue {
  if (!value || typeof value !== 'object') return RANDOM_SCENARIO
  const { categoryId, subId } = value as Partial<ScenarioValue>

  if (!categoryId || categoryId === 'random') return RANDOM_SCENARIO
  if (!SCENARIO_CATEGORY_IDS.has(categoryId)) return RANDOM_SCENARIO

  const cat = getScenarioCategory(categoryId)
  if (!cat) return RANDOM_SCENARIO

  if (!subId) return { categoryId }
  if (cat.subScenarios.some((s) => s.id === subId)) {
    return { categoryId, subId }
  }
  return { categoryId }
}
