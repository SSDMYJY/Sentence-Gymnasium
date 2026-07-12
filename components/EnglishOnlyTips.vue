<template>
    <!-- 当用户的语言不是英文时，显示该信息 / Show this notice only when the user's language is not English -->
    <p v-if="!['en'].includes($i18n.locale)" class="mt-3 text-sm text-red-400">
        <!-- 简体中文提示 / Simplified Chinese notice -->
        <span v-if="['zh-hans'].includes($i18n.locale)">
            本隐私政策的官方版本仅提供英文版本。若你需要当前语言的版本，请联系我们。
        </span>
        <!-- 繁体中文提示 / Traditional Chinese notice -->
        <span v-else-if="['zh-hant'].includes($i18n.locale)">
            本隱私政策的官方版本僅提供英文版本。若你需要當前語言的版本，請聯繫我們。
        </span>
        <!-- 日文提示 / Japanese notice -->
        <span v-else-if="['ja'].includes($i18n.locale)">
            このプライバシーポリシーの公式版は英語のみで提供されています。現在の言語のバージョンが必要な場合は、お問い合わせください。
        </span>
    </p>
</template>