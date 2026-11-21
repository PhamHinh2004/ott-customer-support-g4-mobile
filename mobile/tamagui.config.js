import { createTamagui } from 'tamagui';
import { defaultConfig } from '@tamagui/config/v6';
import { animations } from '@tamagui/config/animations-rn';

const tamaguiConfig = createTamagui({
  ...defaultConfig,
  animations,
});

export default tamaguiConfig;
