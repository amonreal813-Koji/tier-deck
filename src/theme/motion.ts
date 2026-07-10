import { Platform } from 'react-native';
import { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

/**
 * Reanimated entering/exiting animations don't fire inside RN Modals on web —
 * the content gets stuck at its pre-animation state. These helpers return
 * undefined on web (render instantly) and the real spring on native.
 */
export const sheetEntering =
  Platform.OS === 'web' ? undefined : SlideInDown.springify().damping(16).stiffness(190);

export const sheetExiting = Platform.OS === 'web' ? undefined : SlideOutDown.duration(180);

export const backdropEntering = Platform.OS === 'web' ? undefined : FadeIn.duration(180);

export const backdropExiting = Platform.OS === 'web' ? undefined : FadeOut.duration(150);

/**
 * RN-web sizes a Modal's container to the page, not the viewport, so
 * bottom-anchored sheets can land below the fold. Pin to the viewport on web.
 */
export const backdropFixed =
  Platform.OS === 'web'
    ? ({ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 } as const as object)
    : null;
