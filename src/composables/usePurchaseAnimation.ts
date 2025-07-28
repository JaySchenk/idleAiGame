import { ref, readonly } from 'vue'
import { GAME_CONSTANTS } from '../config/gameConstants'

/**
 * Composable for handling purchase animations and visual feedback
 */
export function usePurchaseAnimation() {
  const isPurchasing = ref(false)
  const showPurchaseEffect = ref(false)

  /**
   * Execute a purchase with visual feedback
   * @param purchaseAction - The actual purchase function to execute
   * @param onSuccess - Optional callback for successful purchases
   * @returns Promise that resolves when purchase is complete
   */
  async function executePurchase(
    purchaseAction: () => boolean | Promise<boolean>,
    onSuccess?: () => void,
  ): Promise<boolean> {
    if (isPurchasing.value) return false

    isPurchasing.value = true

    // Visual feedback delay
    await new Promise((resolve) => setTimeout(resolve, GAME_CONSTANTS.PURCHASE_ANIMATION_DELAY))

    const success = await purchaseAction()

    if (success) {
      // Show purchase effect
      showPurchaseEffect.value = true

      // Execute success callback
      onSuccess?.()

      // Hide effect after animation
      setTimeout(() => {
        showPurchaseEffect.value = false
      }, GAME_CONSTANTS.PURCHASE_EFFECT_DURATION)
    }

    isPurchasing.value = false
    return success
  }

  /**
   * Simple purchase without effect animation (for generators)
   */
  async function executePurchaseSimple(
    purchaseAction: () => boolean | Promise<boolean>,
  ): Promise<boolean> {
    if (isPurchasing.value) return false

    isPurchasing.value = true

    // Visual feedback delay
    await new Promise((resolve) => setTimeout(resolve, GAME_CONSTANTS.PURCHASE_ANIMATION_DELAY))

    const success = await purchaseAction()
    isPurchasing.value = false
    return success
  }

  return {
    isPurchasing: readonly(isPurchasing),
    showPurchaseEffect: readonly(showPurchaseEffect),
    executePurchase,
    executePurchaseSimple,
  }
}
