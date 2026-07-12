<template>
	<!-- 应用根：使用默认布局包裹路由页面 / App root: wrap the routed page with the default layout -->
	<NuxtLayout>
		<!-- 当前路由匹配的页面组件 / The page component matched by the current route -->
		<NuxtPage />
	</NuxtLayout>
</template>

<script setup lang="ts">
// 根组件无需额外逻辑 / The root component needs no extra logic
</script>