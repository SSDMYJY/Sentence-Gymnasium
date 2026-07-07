<template>
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
	<Toast :visible="toastVisible" :message="toastMessage" :type="toastType" />
</template>

<script setup lang="ts">
const { visible: toastVisible, message: toastMessage, type: toastType } = useToast()
</script>
