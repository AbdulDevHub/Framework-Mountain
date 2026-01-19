<script setup>
import { defineEmits } from "vue"
const emits = defineEmits(["selectOption"])

const selectOption = (isColor) => {
  emits("selectOption", isColor)
}
</script>

<template>
  <VNavigationDrawer expand-on-hover rail>
    <VList>
      <VListItem
        prepend-avatar="https://avatars.githubusercontent.com/u/27078948?v=4"
        title="Abdul Khan"
        subtitle="ahkn63@gmail.com"
      ></VListItem>
    </VList>

    <VDivider />

    <VList density="compact" nav>
      <VListItem
        prepend-icon="mdi-image"
        title="Color Gallery"
        value="color"
        @click="selectOption(true)"
      />
    </VList>

    <VList density="compact" nav>
      <VListItem
        prepend-icon="mdi-dialpad"
        title="Greyspace Gallery"
        value="color"
        @click="selectOption(false)"
      />
    </VList>
  </VNavigationDrawer>
</template>
