# Repository: YatchiYa/argon-react-native

Generated at: 2024-11-22T13:57:42.699Z

# Table of Contents
- .gitignore
- .watchmanconfig
- App.js
- CHANGELOG.md
- ISSUE_TEMPLATE.md
- LICENSE.md
- README.md
- app.json
- assets/config/argon.json
- assets/font/argon.ttf
- assets/icon.png
- assets/imgs/android.png
- assets/imgs/argon-logo-onboarding.png
- assets/imgs/argon-logo-onboarding@2x.png
- assets/imgs/argon-logo.png
- assets/imgs/argon-logo@2x.png
- assets/imgs/argonlogo.png
- assets/imgs/bg.png
- assets/imgs/getPro-bg.png
- assets/imgs/getPro-bg@2x.png
- assets/imgs/icon.png
- assets/imgs/ios.png
- assets/imgs/profile-screen-bg.png
- assets/imgs/register-bg.png
- assets/imgs/splash.png
- assets/nucleo icons/svg/bag-17.svg
- assets/nucleo icons/svg/basket.svg
- assets/nucleo icons/svg/bell.svg
- assets/nucleo icons/svg/calendar-date.svg
- assets/nucleo icons/svg/chart-pie-35.svg
- assets/nucleo icons/svg/diamond.svg
- assets/nucleo icons/svg/engine-start.svg
- assets/nucleo icons/svg/g-check.svg
- assets/nucleo icons/svg/hat-3.svg
- assets/nucleo icons/svg/ic_mail_24px.svg
- assets/nucleo icons/svg/map-big.svg
- assets/nucleo icons/svg/menu-8.svg
- assets/nucleo icons/svg/nav-down.svg
- assets/nucleo icons/svg/nav-left.svg
- assets/nucleo icons/svg/nav-right.svg
- assets/nucleo icons/svg/padlock-unlocked.svg
- assets/nucleo icons/svg/palette.svg
- assets/nucleo icons/svg/search-zoom-in.svg
- assets/nucleo icons/svg/shop.svg
- assets/nucleo icons/svg/spaceship.svg
- assets/nucleo icons/svg/support.svg
- assets/nucleo icons/svg/switches.svg
- assets/nucleo icons/svg/ungroup.svg
- assets/splash.png
- babel.config.js
- components/Button.js
- components/Card.js
- components/DrawerItem.js
- components/Header.js
- components/Icon.js
- components/Input.js
- components/Select.js
- components/Switch.js
- components/Tabs.js
- components/index.js
- constants/Images.js
- constants/Theme.js
- constants/articles.js
- constants/index.js
- constants/tabs.js
- constants/utils.js
- navigation/Menu.js
- navigation/Screens.js
- package.json
- screens/Articles.js
- screens/Elements.js
- screens/Home.js
- screens/Onboarding.js
- screens/Pro.js
- screens/Profile.js
- screens/Register.js


## File: .gitignore

- Extension: .gitignore
- Language: gitignore
- Size: 102 bytes
- SHA: 6f2647b38b2eae85329f8616934b40980c487b0e
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```gitignore
node_modules/**/*
.expo/*
npm-debug.*
package-lock.json
yarn.lock
*.jks
*.p12
*.key
*.mobileprovision

```

## File: .watchmanconfig

- Extension: .watchmanconfig
- Language: watchmanconfig
- Size: 4 bytes
- SHA: 311847daa5a050a215b149561e1e00c818f5b03b
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```watchmanconfig
{}


```

## File: App.js

- Extension: .js
- Language: javascript
- Size: 2113 bytes
- SHA: 92631902edc5b0caa70a69dc29eb3ab315165aef
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```javascript
import React, { useCallback, useEffect, useState } from "react";
import { Image } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { Asset } from "expo-asset";
import { Block, GalioProvider } from "galio-framework";
import { NavigationContainer } from "@react-navigation/native";

// Before rendering any navigation stack
import { enableScreens } from "react-native-screens";
enableScreens();

import Screens from "./navigation/Screens";
import { Images, articles, argonTheme } from "./constants";

// cache app images
const assetImages = [
  Images.Onboarding,
  Images.LogoOnboarding,
  Images.Logo,
  Images.Pro,
  Images.ArgonLogo,
  Images.iOSLogo,
  Images.androidLogo,
];
// cache product images
articles.map((article) => assetImages.push(article.image));

function cacheImages(images) {
  return images.map((image) => {
    if (typeof image === "string") {
      return Image.prefetch(image);
    } else {
      return Asset.fromModule(image).downloadAsync();
    }
  });
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        //Load Resources
        await _loadResourcesAsync();
        // Pre-load fonts, make any API calls you need to do here
        await Font.loadAsync({
          ArgonExtra: require("./assets/font/argon.ttf"),
        });
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  const _loadResourcesAsync = async () => {
    return Promise.all([...cacheImages(assetImages)]);
  };

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <NavigationContainer onReady={onLayoutRootView}>
      <GalioProvider theme={argonTheme}>
        <Block flex>
          <Screens />
        </Block>
      </GalioProvider>
    </NavigationContainer>
  );
}

```

## File: CHANGELOG.md

- Extension: .md
- Language: markdown
- Size: 7861 bytes
- SHA: 8e360cc51505b68c582e102d4219102a45b4137b
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```markdown
## [1.9.0] 2022 - 08 - 01
- dependencies updated
- expo version updated
- react native version updated
- implement expo-splash-screen for splash loading

## [1.8.1] 2022-07-19

### Updated dependencies

- Fixed the dual header shown issue.
- Updated @react-native-masked-view/masked-view@0.2.4 to @react-native-masked-view/masked-view@0.2.6
- Updated expo@^42.0.0 to expo@^45.0.0
- Updated expo-app-loading@~1.1.2 to expo-app-loading@~2.0.0
- Updated expo-expo-asset@~8.3.2 to expo-asset@~8.5.0
- Updated expo-font@~9.2.1 to expo-font@~10.1.0
- Updated expo-module-core@^0.2.0 to expo-module-core@~0.9.2
- Updated expo-linear-gradient@~9.2.0 to expo-linear-gradient@~11.3.0
- Updated react@16.13.1 to react@17.0.2
- Updated react-native@42.0.0 to react@0.68.2
- Updated react-native-gesture-handler@^1.10.3 to react-native-gesture-handler@~2.2.1
- Updated react-native-reanimated@~2.2.0 to react-native-reanimated@~2.8.0
- Updated react-native-safe-area-context@3.2.0 to react-native-safe-area-context@4.2.4
- Updated react-native-screens@~3.4.0 to react-native-screens@~3.11.1
- Updated dev dependencies
- Updated babel-preset-expo@8.3.0 to babel-preset-expo@~9.1.0
- Updated Babel Config
- Added a new plugin of react-native-reanimated/plugin

## [1.8.0] 2022-04-12

### Updated dependencies

- added `expo-modules-core` dependency
- updated existent dependencies
- issues poped up in `stackNagivator` after updating dependencies so fixed in `screenOption` and updated its code

## [1.7.1] 2021 - 07 - 15

### Updated dependencies

- updated `expo@40.0.0` to `expo@42.0.0`
- updated `expo-asset@8.2.1` to `expo-asset@8.3.2`
- updated `expo-font@8.4.0` to `expo-font@9.2.1`
- updated `galio-framework@0.7.1` to `galio-framework@0.8.0`
- updated `react-native@sdk-40.0.1.tar.gz` to `react-native@sdk-42.0.0.tar.gz`
- updated `react-native-gesture-handler@1.8.0` to `react-native-gesture-handler@1.10.2`
- updated `react-native-reanimated@1.13.0` to `react-native-reanimated@2.2.0`
- updated `react-native-safe-area-context@3.1.9` to `react-native-safe-area-context@3.2.0`
- updated `react-native-screens@2.15.2` to `react-native-screens@3.4.0`

### Updated files

- removed deprecated `useSafeArea` from `navigation/Menu.js`

## [1.7.0] 2020 - 11 - 04

### Updated dependencies

- updated `@react-navigation/bottom-tabs@5.06` to `@react-navigation/bottom-tabs@5.5.1`
- updated `@react-navigation/compat@5.0.0` to `@react-navigation/compat@5.1.25`
- updated `@react-navigation/drawer@5.0.0` to `@react-navigation/drawer@5.12.4`
- updated `@react-navigation/native@5.0.0` to `@react-navigation/native@5.9.3`
- updated `@react-navigation/stack@5.0.0` to `@react-navigation/stack@5.14.3`
- updated `expo SDK@39` to `expo SDK@40`
- updated `expo-asset@8.2.0` to `expo-asset@8.2.1`
- updated `expo-font@8.3.0` to `expo-font@8.4.0`
- updated `react-native SDK@39` to `react-native SDK@40`
- updated `react-native-gesture-handler@1.7.0` to `react-native-gesture-handler@1.8.0`
- updated `react-native-safe-area-context@3.1.4` to `react-native-safe-area-context@3.1.9`
- updated `react-native-screens@2.10.1` to `react-native-screens@2.15.2`
- added `expo-app-loading@1.01`

### Updated files

- `useNativeDriver` warning fixed in `Tabs.js`
- card height changed in `Register.js`

## [1.6.0] 2020 - 11 - 04

### Updated dependencies

- updated `expo-asset@8.1.5` to `expo-asset@8.2.0`
- updated `expo-font@8.1.0` to `expo-font@8.3.0`
- updated `react-native-gesture-handler@1.6.0` to `react-native-gesture-handler@1.7.0`
- updated `react-native-reanimated@1.7.0` to `react-native-reanimated@1.13.0`
- updated `react-native-screens@2.2.0` to `react-native-screens@2.10.1`
- updated `react-native-safe-area-context@0.7.3` to `react-native-safe-area-context@3.1.4`
- updated `@react-native-community/maksed-view@0.1.6` to `@react-native-community/maksed-view@0.1.10`
- updated `react-native SDK@37.0.0` to `react-native SDK@39.0.0`
- updated `react@16.9.0` to `react@16.13.1`
- updated `babel-preset-expo@8.2.1` to `babel-preset-expo@8.3.0`
- updated `expo SDK@37.0.0` to `expo SDK@39.0.0`
- updated `galio-framework@0.6.3` to `galio-framework@0.7.1`
- changed the git source for react-native-modal-dropdown

### Updated files

- Profile.js - fixed elements regarding the Photo Album
- Elements.js - ScrollView fixed by adding width, PR accepted which removed a duplicate styling [#24](https://github.com/creativetimofficial/argon-react-native/pull/24)
- App.js - fixed Invariant Violation via PR [#29](https://github.com/creativetimofficial/argon-react-native/pull/29)

## [1.5.0] 2020 - 06 - 04

### Updated dependencies

- updated `expo-asset@8.0.0` to `expo-asset@8.1.5`
- updated `expo-font@8.0.0` to `expo-font@8.1.0`
- updated `react-native-gesture-handler@1.5.0` to `react-native-gesture-handler@1.6.0`
- updated `react-native-reanimated@1.4.0` to `react-native-reanimated@1.7.0`
- updated `react-native-screens@2.0.0-alpha.12` to `react-native-screens@2.2.0`
- updated `react-native-safe-area-context@0.6.0` to `react-native-safe-area-context@0.7.3`
- updated `@react-native-community/masked-view@0.1.5` to `@react-native-community/masked-view@0.1.6`
- updated `react-native SDK@36.0.0` to `react-native SDK@37.0.0`
- updated `babel-preset-expo@7.0.0` to `babel-preset-expo@8.2.1`
- updated `Expo @36.0.0` to `Expo @37.0.0`

### Updated files

- used hooks for App.js
- moved `assets/font/argon.json` to `assets/config/argon.json` in order to make sure there wouldn't be any issue with the build for Android

## [1.4.0] 2020 - 03 - 05

### Removed dependencies

- removed `react-navigation@3.11.0`

### Added dependencies

- added `@react-navigation/compat@5.0.0`
- added `@react-navigation/drawer@5.0.0`
- added `@react-navigation/native@5.0.0`
- added `@react-navigation/stack@5.0.0`
- added `@react-native-community/masked-view@0.1.5`
- added `react-native-reanimated@1.4.0`
- added `react-native-safe-area-context@0.6.0`
- added `react-native-screeens@2.0.0-alpha.12`

### Updated dependencies

- updated `expo@35.0.0` to `expo@36.0.0`
- updated `expo-asset@7.0.0` to `expo-asset@8.0.0`
- updated `expo-font@7.0.0` to `expo-font@8.0.0`
- updated `expo-cli@2.4.0` to `expo-cli@3.11.7`
- updated `expo-linear-gradient@7.0.0` to `expo-linear-gradient@8.0.0`
- updated `react@16.8.3` to `react@16.9.0`

### Updated files

- changed the whole routing from `Screens.js` because `react-navigation@5.0.0` has a new dynamic API
- changed `Menu.js` for a new Drawer custom component
- changed `DrawerItem.js` for a new type of `<DrawerCustomItem />`
- changed props and variables so that the new `react-navigation` API could work with the following files: `Beauty.js`, `Header.js`, `Product.js`, `Gallery.js`, `Pro.js`, `Product.js`, `Settings.js`, `Register.js`, `Onboarding.js`

## [1.3.0] 2019-11-06

### Updated dependencies

- `expo@34.0.3` to `expo@35.0.0`
- `expo-font@6.0.1` to `expo-font@7.0.0`
- `expo-asset@6.0.0` to `expo-asset@7.0.0`
- `react-native SDK@34.0.0` to `react-native SDK@35.0.0`
- `galio-framework@0.6.1` to `galio-framework@0.6.3`
- `babel-preset-expo@5.0.0` to `babel-preset-expo@7.0.0`

### Updated files

- changed drawer items in order to have a similar look to the PRO version

## [1.2.0] 2019-09-18

### Updated dependencies

- `expo@33.0.0` to `expo@34.0.3`
- `expo-font@5.0.1` to `expo-font@6.0.1`
- added `expo-asset@6.0.0`
- `react-native SDK@33.0.0` to `react-native SDK@34.0.0`
- added `react-native-gesture-handler@1.3.0`
- `galio-framework@0.5.3` to `galio-framework@0.6.1`

## [1.1.0] 2019-06-21

### Updated dependencies

- `expo@32.0.0` to `expo@33.0.0`
- `galio-framework@0.5.1` to `galio-framework@0.5.3`
- `react-native SDK@32.0.0` to `react-native SDK@33.0.0`
- `react-navigation@3.8.1` to `react-navigation@3.11.0`
- `react@16.5.0` to `react@16.8.3`
- added `expo-font@5.0.1`

## [1.0.0] 2019-06-07

### Initial Release

```

## File: ISSUE_TEMPLATE.md

- Extension: .md
- Language: markdown
- Size: 1044 bytes
- SHA: 8ef7b6891d5ae2e035dc7374ecbbba35e5ddd84d
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```markdown
# Prerequisites

Please answer the following questions for yourself before submitting an issue.

- [ ] I am running the latest version
- [ ] I checked the documentation and found no answer
- [ ] I checked to make sure that this issue has not already been filed
- [ ] I'm reporting the issue to the correct repository (for multi-repository projects)

# Expected Behavior

Please describe the behavior you are expecting

# Current Behavior

What is the current behavior?

# Failure Information (for bugs)

Please help provide information about the failure if this is a bug. If it is not a bug, please remove the rest of this template.

## Steps to Reproduce

Please provide detailed steps for reproducing the issue.

1. step 1
2. step 2
3. you get it...

## Context

Please provide any relevant information about your setup. This is important in case the issue is not reproducible except for under certain conditions.

* Device:
* Operating System:
* Browser and Version:

## Failure Logs

Please include any relevant log snippets or files here.

```

## File: LICENSE.md

- Extension: .md
- Language: markdown
- Size: 1068 bytes
- SHA: 6f49c4d66bb14e3e302edf19a56fbbe4aea1c554
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```markdown
MIT License

Copyright (c) 2019 Creative Tim

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## File: README.md

- Extension: .md
- Language: markdown
- Size: 11970 bytes
- SHA: f7445b7924680d8327277b038ce7e099e28fbb3a
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```markdown
# [Argon React Native](https://creativetimofficial.github.io/argon-react-native/docs/#) [![Tweet](https://img.shields.io/twitter/url/http/shields.io.svg?style=social&logo=twitter)](https://twitter.com/home?status=Argon%20React%20Native,%20a%20cool%20Argon%20React%20Native%20App%20Template%20%E2%9D%A4%EF%B8%8F%20https%3A//bit.ly/2KAj86H%20%23reactnative%20%23argon%20%23designsystem%20%23developers%20via%20%40CreativeTim)


 ![version](https://img.shields.io/badge/version-1.9.0-blue.svg)  [![GitHub issues open](https://img.shields.io/github/issues/creativetimofficial/argon-react-native.svg?style=flat)](https://github.com/creativetimofficial/argon-react-native/issues?q=is%3Aopen+is%3Aissue) [![GitHub issues closed](https://img.shields.io/github/issues-closed-raw/creativetimofficial/argon-react-native.svg?maxAge=2592000)](https://github.com/creativetimofficial/argon-react-native/issues?q=is%3Aissue+is%3Aclosed)


![Product Gif](https://raw.githubusercontent.com/creativetimofficial/public-assets/master/argon-react-native/arg-rn-thumbnail.jpg)

Argon React Native is a fully coded app template built over [Galio.io](https://galio.io/?ref=creativetim), [React Native](https://facebook.github.io/react-native/?ref=creativetim) and [Expo](https://expo.io/?ref=creativetim) to allow you to create powerful and beautiful e-commerce mobile applications. We have redesigned all the usual components in Galio to make it look like Argon's Design System, minimalistic and easy to use.

Start your development with a badass Design System for React Native inspired by Argon Design System. If you like Argon's Design System, you will love this react native app template! It features a huge number of components and screens built to fit together and look amazing. 

### FULLY CODED COMPONENTS

Argon React Native features over 200 variations of components like buttons, inputs, cards, navigations etc, giving you the freedom of choosing and combining. All components can take variations in colour, that you can easily modify inside our theme file.

You will save a lot of time going from prototyping to full-functional code, because all elements are implemented. We wanted the design process to be seamless, so switching from image to the real page is very easy to do.

### Components & Cards
Argon React Native comes packed with a large number of components and cards. Putting together a mobile app has never been easier than matching together different components. From the profile screen to a settings screen, you can easily customise and build your screens. We have created multiple options for you to put together and customise into pixel perfect screens. 

View [ all components/cards here](https://demos.creative-tim.com/argon-react-native/index.html#cards).

### Example Screens
If you want to get inspiration or just show something directly to your clients, you can jump start your development with our pre-built example screens. From onboarding screens to profile or discover screens, you will be able to quickly set up the basic structure for your React Native mobile project. 

View [all screens here](https://demos.creative-tim.com/argon-react-native/index.html#screens).


Let us know your thoughts below. And good luck with development!


## Table of Contents

* [Versions](#versions) 
* [Demo](#demo)
* [Quick Start](#quick-start)
* [Documentation](#documentation)
* [File Structure](#file-structure)
* [OS Support](#os-support)
* [Resources](#resources)
* [Reporting Issues](#reporting-issues)
* [Technical Support or Questions](#technical-support-or-questions)
* [Licensing](#licensing)
* [Useful Links](#useful-links)

## Versions

[<img src="https://github.com/creativetimofficial/public-assets/blob/master/logos/html-logo.jpg?raw=true" width="60" height="60" />](https://www.creative-tim.com/product/argon-design-system)[<img src="https://github.com/creativetimofficial/public-assets/blob/master/logos/vue-logo.jpg?raw=true" width="60" height="60" />](https://www.creative-tim.com/product/vue-argon-design-system)[<img src="https://github.com/creativetimofficial/public-assets/blob/master/logos/react-logo.jpg?raw=true" width="60" height="60" />](https://www.creative-tim.com/product/argon-design-system-react)[<img src="https://github.com/creativetimofficial/public-assets/blob/master/logos/react-native-logo.jpg?raw=true" width="60" height="60" />](https://www.creative-tim.com/product/argon-react-native)[<img src="https://github.com/creativetimofficial/public-assets/blob/master/logos/angular-logo.jpg?raw=true" width="60" height="60" />](https://www.creative-tim.com/product/argon-dashboard-angular)





| HTML | React | Angular  |
| --- | --- | ---  |
| [![Argon Design System](https://raw.githubusercontent.com/creativetimofficial/public-assets/master/argon-design-system/argon-design-system.jpg)](https://www.creative-tim.com/product/argon-design-system)  | [![Argon Design System React](https://raw.githubusercontent.com/creativetimofficial/public-assets/master/argon-design-system-react/argon-design-system-react.jpg)](https://www.creative-tim.com/product/argon-design-system-react)  | [![Argon Design System Angular](https://raw.githubusercontent.com/creativetimofficial/public-assets/master/argon-design-system-angular/argon-design-system-angular.jpg)](https://www.creative-tim.com/product/argon-design-system-angular)

## Demo

| Home Screen | Profile Screen | Elements Screen | Register Screen |
| --- | --- | --- | --- |
| [![Home Screen](https://raw.githubusercontent.com/creativetimofficial/public-assets/master/argon-react-native/home-screen.png)](https://demos.creative-tim.com/argon-react-native/) | [![Profile Screen](https://raw.githubusercontent.com/creativetimofficial/public-assets/master/argon-react-native/profile-screen.png)](https://demos.creative-tim.com/argon-react-native/) | [![Elements Screen](https://raw.githubusercontent.com/creativetimofficial/public-assets/master/argon-react-native/elements-screen.png)](https://demos.creative-tim.com/argon-react-native/) | [![Register Screen](https://raw.githubusercontent.com/creativetimofficial/public-assets/master/argon-react-native/register-screen.png)](https://demos.creative-tim.com/argon-react-native/) |

- [Start page](https://demos.creative-tim.com/argon-react-native)
- [How to install our free demo](https://demos.creative-tim.com/argon-react-native/docs/#/install)

[View more](https://demos.creative-tim.com/argon-react-native)

## Quick start
- Try it out on Expo (Simulator for iOS or even your physical device if you have an Android)
- Download from [Creative Tim](https://www.creative-tim.com/product/argon-react-native)


## Documentation
The documentation for the Argon React Native is hosted at our [website](https://demos.creative-tim.com/argon-react-native/docs/).


## File Structure
Within the download you'll find the following directories and files:

```
argon-react-native/
├── App.js
├── README.md
├── app.json
├── assets
├── babel.config.js
├── components
│   ├── Button.js
│   ├── DrawerItem.js
│   ├── Header.js
│   ├── Icon.js
│   ├── Card.js
│   ├── Select.js
│   ├── Switch.js
│   ├── Tabs.js
│   └── index.js
├── constants
│   ├── Images.js
│   ├── Theme.js
│   ├── index.js
│   ├── articles.js
│   ├── tabs.js
│   └── utils.js
├── navigation
│   ├── Menu.js
│   └── Screens.js
├── package.json
├── screens
│   ├── Articles.js
│   ├── Home.js
│   ├── Elements.js
│   ├── Onboarding.js
│   ├── Pro.js
│   ├── Profile.js
│   └── Register.js

```


## OS Support

At present, we officially aim to support the last two versions of the following operating systems:

[<img src="https://raw.githubusercontent.com/creativetimofficial/ct-material-kit-pro-react-native/master/assets/android-logo.png" width="60" height="60" />](https://www.creative-tim.com/product/material-kit-pro-react-native)[<img src="https://raw.githubusercontent.com/creativetimofficial/ct-material-kit-pro-react-native/master/assets/apple-logo.png" width="60" height="60" />](https://www.creative-tim.com/product/material-kit-pro-react-native)



## Resources
- Demo: <https://demos.creative-tim.com/argon-react-native>
- Download Page: <https://www.creative-tim.com/product/argon-react-native>
- Documentation: <https://demos.creative-tim.com/argon-react-native/docs>
- License Agreement: <https://www.creative-tim.com/license>
- Support: <https://www.creative-tim.com/contact-us>
- Issues: [Github Issues Page](https://github.com/creativetimofficial/argon-react-native/issues)
- [Argon Design System](https://www.creative-tim.com/product/argon-design-system?ref=argonrn-readme) - For Front End Development
- **Dashboards:**

| HTML | React | Angular |
| --- | --- | ---  |
| [![Argon HTML](https://raw.githubusercontent.com/creativetimofficial/public-assets/master/argon-dashboard/argon-dashboard.jpg)](https://www.creative-tim.com/product/argon-dashboard) | [![Argon Dashboard React](https://raw.githubusercontent.com/creativetimofficial/public-assets/master/argon-dashboard-react/argon-dashboard-react.jpg)](https://www.creative-tim.com/product/argon-dashboard-react) | [![Argon Dashboard Angular](https://raw.githubusercontent.com/creativetimofficial/public-assets/master/argon-dashboard-angular/argon-dashboard-angular.jpg)](https://www.creative-tim.com/product/argon-dashboard-angular)

| Node.js | ASP.NET  |
| --- | --- |
| [![Argon Dashboard NodeJS](https://raw.githubusercontent.com/creativetimofficial/public-assets/master/argon-dashboard-nodejs/argon-dashboard-nodejs.jpg)](https://www.creative-tim.com/product/argon-dashboard-nodejs) | [![Argon Dashboard ASP.NET](https://github.com/creativetimofficial/public-assets/blob/master/argon-dashboard-aspnet/argon-dashboard-aspnet.gif)](https://www.creative-tim.com/product/argon-dashboard-asp-net)


## Reporting Issues

We use GitHub Issues as the official bug tracker for the Argon React Native. Here are some advices for our users that want to report an issue:

1. Make sure that you are using the latest version of the Argon React Native.
2. Providing us reproducible steps for the issue will shorten the time it takes for it to be fixed.
3. Some issues may be browser specific, so specifying in what browser you encountered the issue might help.


### Technical Support or Questions

If you have questions or need help integrating the product please [contact us](https://www.creative-tim.com/contact-us) instead of opening an issue.


## Licensing

- Copyright 2020 Creative Tim (https://www.creative-tim.com/)

- Licensed under MIT (https://github.com/creativetimofficial/argon-react-native/blob/master/LICENSE.md)



## Useful Links

- [Tutorials](https://www.youtube.com/channel/UCVyTG4sCw-rOvB9oHkzZD1w)
- [Affiliate Program](https://www.creative-tim.com/affiliates/new) (earn money)
- [Blog Creative Tim](http://blog.creative-tim.com/)
- [Free Products](https://www.creative-tim.com/bootstrap-themes/free) from Creative Tim
- [Premium Products](https://www.creative-tim.com/bootstrap-themes/premium) from Creative Tim
- [React Products](https://www.creative-tim.com/bootstrap-themes/react-themes) from Creative Tim
- [Angular Products](https://www.creative-tim.com/bootstrap-themes/angular-themes) from Creative Tim
- [VueJS Products](https://www.creative-tim.com/bootstrap-themes/vuejs-themes) from Creative Tim
- [More products](https://www.creative-tim.com/bootstrap-themes) from Creative Tim
- Check our Bundles [here](https://www.creative-tim.com/bundles?ref="argon-github-readme")


### Social Media

Twitter: <https://twitter.com/CreativeTim>

Facebook: <https://www.facebook.com/CreativeTim>

Dribbble: <https://dribbble.com/creativetim>

Instagram: <https://www.instagram.com/CreativeTimOfficial>


```

## File: app.json

- Extension: .json
- Language: json
- Size: 640 bytes
- SHA: b1702aa3e80bd58355be4a9aaaa5fa2e164ee4a3
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```json
{
  "expo": {
    "name": "Argon FREE React Native",
    "slug": "argon-free-react-native",
    "privacy": "public",
    "platforms": [
      "ios",
      "android"
    ],
    "version": "1.7.1",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "cover",
      "backgroundColor": "#ffffff"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true
    },
    "description": "Argon React Native, based on Argon Design System. Coded by Creative Tim"
  }
}

```

## File: assets/config/argon.json

- Extension: .json
- Language: json
- Size: 16936 bytes
- SHA: 716c8ba31b666c4519ea317330095162cdb39664
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```json
{"IcoMoonType":"selection","icons":[{"icon":{"paths":["M675.84 0l-512 512 512 512 179.2-179.2-332.8-332.8 332.8-332.8-179.2-179.2z"],"attrs":[{}],"isMulticolor":false,"isMulticolor2":false,"grid":0,"tags":["nav-left"]},"attrs":[{}],"properties":{"order":50,"id":22,"name":"nav-left","prevSize":32,"code":59670},"setIdx":0,"setId":3,"iconIdx":0},{"icon":{"paths":["M853.333 0h-682.667c-72.533 0-128 55.467-128 128v853.333c0 25.6 17.067 42.667 42.667 42.667h853.333c25.6 0 42.667-17.067 42.667-42.667v-853.333c0-72.533-55.467-128-128-128zM512 682.667c-140.8 0-256-115.2-256-256 0-25.6 17.067-42.667 42.667-42.667s42.667 17.067 42.667 42.667c0 93.867 76.8 170.667 170.667 170.667s170.667-76.8 170.667-170.667c0-25.6 17.067-42.667 42.667-42.667s42.667 17.067 42.667 42.667c0 140.8-115.2 256-256 256zM853.333 170.667h-682.667c-25.6 0-42.667-17.067-42.667-42.667s17.067-42.667 42.667-42.667h682.667c25.6 0 42.667 17.067 42.667 42.667s-17.067 42.667-42.667 42.667z"],"attrs":[{}],"isMulticolor":false,"isMulticolor2":false,"grid":0,"tags":["bag-17"]},"attrs":[{}],"properties":{"order":28,"id":21,"name":"bag-17","prevSize":32,"code":59648},"setIdx":0,"setId":3,"iconIdx":1},{"icon":{"paths":["M85.333 896c0 70.692 57.308 128 128 128v0h597.333c70.692 0 128-57.308 128-128v0-298.667h-853.333z","M839.509 341.333l-142.251-284.587c-10.815-20.917-32.285-34.968-57.036-34.968-35.346 0-64 28.654-64 64 0 10.245 2.407 19.927 6.687 28.513l-0.167-0.371 113.749 227.413h-368.981l113.749-227.413c4.112-8.214 6.519-17.897 6.519-28.141 0-35.346-28.654-64-64-64-24.752 0-46.222 14.051-56.868 34.612l-0.168 0.357-142.251 284.587h-184.491v170.667h1024v-170.667z"],"attrs":[{},{}],"isMulticolor":false,"isMulticolor2":false,"grid":0,"tags":["basket"]},"attrs":[{},{}],"properties":{"order":29,"id":20,"name":"basket","prevSize":32,"code":59649},"setIdx":0,"setId":3,"iconIdx":2},{"icon":{"paths":["M853.333 426.667v-85.333c0-188.513-152.82-341.333-341.333-341.333s-341.333 152.82-341.333 341.333v0 85.333c-2.264 54.579-27.284 102.899-65.757 136.026l-0.248 0.209c-34.496 29.523-57.513 71.592-61.941 119.058l-0.053 0.708c0 106.667 175.445 170.667 469.333 170.667s469.333-64 469.333-170.667c-4.482-48.174-27.498-90.242-61.752-119.562l-0.243-0.203c-38.722-33.335-63.741-81.655-65.993-135.855l-0.013-0.38z","M390.187 934.4c16.761 52.286 64.945 89.472 121.813 89.472s105.053-37.186 121.563-88.568l0.251-0.904c-38.144 2.816-78.677 4.267-121.813 4.267s-83.669-1.365-121.813-4.267z"],"attrs":[{},{}],"isMulticolor":false,"isMulticolor2":false,"grid":0,"tags":["bell"]},"attrs":[{},{}],"properties":{"order":30,"id":19,"name":"bell","prevSize":32,"code":59650},"setIdx":0,"setId":3,"iconIdx":3},{"icon":{"paths":["M170.667 426.667h170.667v128h-170.667v-128z","M426.667 426.667h170.667v128h-170.667v-128z","M170.667 640h170.667v128h-170.667v-128z","M426.667 640h170.667v128h-170.667v-128z","M682.667 426.667h170.667v128h-170.667v-128z","M981.333 128h-213.333v-85.333c0-23.564-19.103-42.667-42.667-42.667s-42.667 19.103-42.667 42.667v0 85.333h-341.333v-85.333c0-23.564-19.103-42.667-42.667-42.667s-42.667 19.103-42.667 42.667v0 85.333h-213.333c-23.564 0-42.667 19.103-42.667 42.667v0 768c0 23.564 19.103 42.667 42.667 42.667v0h938.667c23.564 0 42.667-19.103 42.667-42.667v0-768c0-23.564-19.103-42.667-42.667-42.667v0zM938.667 896h-853.333v-597.333h853.333z"],"attrs":[{},{},{},{},{},{}],"isMulticolor":false,"isMulticolor2":false,"grid":0,"tags":["calendar-date"]},"attrs":[{},{},{},{},{},{}],"properties":{"order":31,"id":18,"name":"calendar-date","prevSize":32,"code":59651},"setIdx":0,"setId":3,"iconIdx":4},{"icon":{"paths":["M554.667 469.333h467.157c-20.608-248.277-218.88-446.549-467.157-467.157v467.157z","M529.664 554.667l-347.947 347.947c89.259 75.563 204.459 121.387 330.283 121.387 267.904 0 488.021-206.976 509.824-469.333h-492.16z","M469.333 494.336v-492.16c-262.357 21.803-469.333 241.92-469.333 509.824 0 125.824 45.824 241.024 121.387 330.283l347.947-347.947z"],"attrs":[{},{},{}],"isMulticolor":false,"isMulticolor2":false,"grid":0,"tags":["chart-pie-35"]},"attrs":[{},{},{}],"properties":{"order":32,"id":17,"name":"chart-pie-35","prevSize":32,"code":59652},"setIdx":0,"setId":3,"iconIdx":5},{"icon":{"paths":["M800.768 58.027c-8.107-9.728-20.096-15.36-32.768-15.36h-512c-12.672 0-24.661 5.632-32.768 15.36l-213.333 256c-12.544 15.061-13.227 36.736-1.664 52.523l469.333 640c8.064 10.965 20.864 17.451 34.432 17.451s26.368-6.485 34.432-17.451l469.333-640c11.563-15.829 10.923-37.461-1.664-52.523l-213.333-256zM810.667 384h-597.333v-85.333h597.333v85.333z"],"attrs":[{}],"isMulticolor":false,"isMulticolor2":false,"grid":0,"tags":["diamond"]},"attrs":[{}],"properties":{"order":33,"id":16,"name":"diamond","prevSize":32,"code":59653},"setIdx":0,"setId":3,"iconIdx":6},{"icon":{"paths":["M512 960c-247.418-0.008-447.986-200.581-447.986-448 0-132.464 57.49-251.501 148.881-333.52l0.417-0.368 85.376 95.36c-65.605 58.85-106.688 143.894-106.688 238.533 0 176.731 143.269 320 320 320s320-143.269 320-320c0-94.639-41.083-179.683-106.389-238.269l-0.299-0.264 85.312-95.36c91.808 82.388 149.298 201.424 149.298 333.888 0 247.396-200.532 447.956-447.918 448l-0.004 0z","M448 0h128v448h-128v-448z"],"attrs":[{},{}],"isMulticolor":false,"isMulticolor2":false,"grid":0,"tags":["engine-start"]},"attrs":[{},{}],"properties":{"order":34,"id":15,"name":"engine-start","prevSize":32,"code":59654},"setIdx":0,"setId":3,"iconIdx":7},{"icon":{"paths":["M1024 230.4l-51.2-102.4c-441.6 128-665.6 409.6-665.6 409.6l-204.8-153.6-102.4 102.4 307.2 409.6c236.8-441.6 716.8-665.6 716.8-665.6z"],"attrs":[{}],"isMulticolor":false,"isMulticolor2":false,"grid":0,"tags":["g-check"]},"attrs":[{}],"properties":{"order":35,"id":14,"name":"g-check","prevSize":32,"code":59655},"setIdx":0,"setId":3,"iconIdx":8},{"icon":{"paths":["M938.667 469.333h85.333v256h-85.333v-256z","M564.949 671.147c-16.811 7.68-34.603 11.52-52.949 11.52s-36.139-3.84-52.907-11.477l-288.427-131.115v227.925c0 112.043 171.691 170.667 341.333 170.667s341.333-58.624 341.333-170.667v-227.883l-288.384 131.029z","M998.997 302.507l-469.333-213.333c-11.221-5.077-24.064-5.077-35.285 0l-469.333 213.333c-15.275 6.912-25.045 22.059-25.045 38.827s9.771 31.915 25.003 38.827l469.333 213.333c5.632 2.56 11.648 3.84 17.664 3.84s12.032-1.28 17.664-3.84l469.333-213.333c15.232-6.912 25.003-22.059 25.003-38.827s-9.771-31.915-25.003-38.827z"],"attrs":[{},{},{}],"isMulticolor":false,"isMulticolor2":false,"grid":0,"tags":["hat-3"]},"attrs":[{},{},{}],"properties":{"order":36,"id":13,"name":"hat-3","prevSize":32,"code":59656},"setIdx":0,"setId":3,"iconIdx":9},{"icon":{"paths":["M853.333 170.667h-682.667c-46.933 0-84.907 38.4-84.907 85.333l-0.427 512c0 46.933 38.4 85.333 85.333 85.333h682.667c46.933 0 85.333-38.4 85.333-85.333v-512c0-46.933-38.4-85.333-85.333-85.333zM853.333 341.333l-341.333 213.333-341.333-213.333v-85.333l341.333 213.333 341.333-213.333v85.333z"],"attrs":[{}],"isMulticolor":false,"isMulticolor2":false,"grid":0,"tags":["ic_mail_24px"]},"attrs":[{}],"properties":{"order":46,"id":12,"name":"ic_mail_24px","prevSize":32,"code":59657},"setIdx":0,"setId":3,"iconIdx":10},{"icon":{"paths":["M725.333 58.965l-170.667 85.333v820.736l170.667-85.333z","M469.333 144.299l-170.667-85.333v820.736l170.667 85.333z","M213.333 61.184l-192.64 115.584c-12.8 7.68-20.693 21.547-20.693 36.565v810.667l213.333-137.984v-824.832z","M1003.307 176.768l-192.64-115.584v824.832l213.333 137.984v-810.667c0-15.019-7.893-28.885-20.693-36.565z"],"attrs":[{},{},{},{}],"isMulticolor":false,"isMulticolor2":false,"grid":0,"tags":["map-big"]},"attrs":[{},{},{},{}],"properties":{"order":47,"id":11,"name":"map-big","prevSize":32,"code":59658},"setIdx":0,"setId":3,"iconIdx":11},{"icon":{"paths":["M938.667 768h-853.333c-47.128 0-85.333 38.205-85.333 85.333s38.205 85.333 85.333 85.333v0h853.333c47.128 0 85.333-38.205 85.333-85.333s-38.205-85.333-85.333-85.333v0z","M938.667 85.333h-853.333c-47.128 0-85.333 38.205-85.333 85.333s38.205 85.333 85.333 85.333v0h853.333c47.128 0 85.333-38.205 85.333-85.333s-38.205-85.333-85.333-85.333v0z","M938.667 426.667h-853.333c-47.128 0-85.333 38.205-85.333 85.333s38.205 85.333 85.333 85.333v0h853.333c47.128 0 85.333-38.205 85.333-85.333s-38.205-85.333-85.333-85.333v0z"],"attrs":[{},{},{}],"isMulticolor":false,"isMulticolor2":false,"grid":0,"tags":["menu-8"]},"attrs":[{},{},{}],"properties":{"order":48,"id":10,"name":"menu-8","prevSize":32,"code":59659},"setIdx":0,"setId":3,"iconIdx":12},{"icon":{"paths":["M512 501.931l-328.704-328.704-176.981 176.981 505.685 505.685 505.685-505.685-176.981-176.981-328.704 328.704z"],"attrs":[{}],"isMulticolor":false,"isMulticolor2":false,"grid":0,"tags":["nav-down"]},"attrs":[{}],"properties":{"order":49,"id":9,"name":"nav-down","prevSize":32,"code":59660},"setIdx":0,"setId":3,"iconIdx":13},{"icon":{"paths":["M168.96 179.2l332.8 332.8-332.8 332.8 179.2 179.2 512-512-512-512-179.2 179.2z"],"attrs":[{}],"isMulticolor":false,"isMulticolor2":false,"grid":0,"tags":["nav-right"]},"attrs":[{}],"properties":{"order":37,"id":8,"name":"nav-right","prevSize":32,"code":59661},"setIdx":0,"setId":3,"iconIdx":14},{"icon":{"paths":["M512 128c38.4 0 70.4 12.8 96 44.8l44.8 44.8 96-83.2-44.8-51.2c-51.2-51.2-121.6-83.2-192-83.2-140.8 0-256 115.2-256 256v96c-76.8 70.4-128 172.8-128 288 0 211.2 172.8 384 384 384s384-172.8 384-384-172.8-384-384-384c-44.8 0-89.6 6.4-128 25.6v-25.6c0-70.4 57.6-128 128-128zM512 448c70.4 0 128 57.6 128 128 0 44.8-25.6 89.6-64 108.8v147.2h-128v-147.2c-38.4-19.2-64-64-64-108.8 0-70.4 57.6-128 128-128z"],"attrs":[{}],"isMulticolor":false,"isMulticolor2":false,"grid":0,"tags":["padlock-unlocked"]},"attrs":[{}],"properties":{"order":38,"id":7,"name":"padlock-unlocked","prevSize":32,"code":59662},"setIdx":0,"setId":3,"iconIdx":15},{"icon":{"paths":["M870.4 260.267c-46.933-21.333-93.867-34.133-145.067-34.133-68.267 0-128 21.333-183.467 38.4-34.133 12.8-68.267 21.333-93.867 21.333-17.067 0-25.6-4.267-29.867-12.8 0-4.267 4.267-25.6 8.533-38.4 12.8-38.4 25.6-85.333-8.533-132.267-21.333-25.6-55.467-42.667-93.867-42.667s-72.533 12.8-106.667 34.133c-136.533 93.867-217.6 251.733-217.6 418.133 0 281.6 230.4 512 512 512 226.133 0 430.933-153.6 494.933-375.467 4.267-25.6 64-290.133-136.533-388.267zM128 512c0-46.933 38.4-85.333 85.333-85.333s85.333 38.4 85.333 85.333-38.4 85.333-85.333 85.333-85.333-38.4-85.333-85.333zM320 810.667c-46.933 0-85.333-38.4-85.333-85.333s38.4-85.333 85.333-85.333 85.333 38.4 85.333 85.333-38.4 85.333-85.333 85.333zM554.667 896c-46.933 0-85.333-38.4-85.333-85.333s38.4-85.333 85.333-85.333 85.333 38.4 85.333 85.333-38.4 85.333-85.333 85.333zM725.333 640c-72.533 0-128-55.467-128-128s55.467-128 128-128 128 55.467 128 128-55.467 128-128 128z"],"attrs":[{}],"isMulticolor":false,"isMulticolor2":false,"grid":0,"tags":["palette"]},"attrs":[{}],"properties":{"order":39,"id":6,"name":"palette","prevSize":32,"code":59663},"setIdx":0,"setId":3,"iconIdx":16},{"icon":{"paths":["M640 512h-128v128h-128v-128h-128v-128h128v-128h128v128h128v128z","M448 896c-247.040 0-448-200.96-448-448s200.96-448 448-448 448 200.96 448 448-200.96 448-448 448zM448 128c-176.448 0-320 143.552-320 320s143.552 320 320 320 320-143.552 320-320-143.552-320-320-320z","M1005.248 914.752l-153.152-153.152c-26.304 33.856-56.64 64.192-90.496 90.496l153.152 153.152c12.48 12.48 28.864 18.752 45.248 18.752s32.768-6.272 45.248-18.752c25.024-25.024 25.024-65.472 0-90.496z"],"attrs":[{},{},{}],"isMulticolor":false,"isMulticolor2":false,"grid":0,"tags":["search-zoom-in"]},"attrs":[{},{},{}],"properties":{"order":40,"id":5,"name":"search-zoom-in","prevSize":32,"code":59664},"setIdx":0,"setId":3,"iconIdx":17},{"icon":{"paths":["M889.6 32c-12.8-19.2-32-32-57.6-32h-640c-25.6 0-44.8 12.8-57.6 32-134.4 256-134.4 268.8-134.4 288 0 70.4 57.6 128 128 128v512c0 38.4 25.6 64 64 64h640c38.4 0 64-25.6 64-64v-512c70.4 0 128-57.6 128-128 0-19.2 0-32-134.4-288zM640 896v-256h-256v256h-128v-467.2c19.2 12.8 38.4 19.2 64 19.2 38.4 0 70.4-19.2 96-44.8 25.6 25.6 57.6 44.8 96 44.8s70.4-19.2 96-44.8c25.6 25.6 57.6 44.8 96 44.8 25.6 0 44.8-6.4 64-19.2v467.2h-128z"],"attrs":[{}],"isMulticolor":false,"isMulticolor2":false,"grid":0,"tags":["shop"]},"attrs":[{}],"properties":{"order":41,"id":4,"name":"shop","prevSize":32,"code":59665},"setIdx":0,"setId":3,"iconIdx":18},{"icon":{"paths":["M1006.080 18.091c-7.731-7.783-18.44-12.601-30.273-12.601-0.772 0-1.54 0.021-2.302 0.061l0.106-0.005c-598.528 31.232-819.627 564.395-821.76 569.771-1.953 4.716-3.087 10.192-3.087 15.933 0 11.77 4.766 22.428 12.474 30.147l-0.001-0.001 241.365 241.365c7.719 7.708 18.376 12.474 30.147 12.474 5.822 0 11.371-1.166 16.428-3.277l-0.282 0.104c5.333-2.176 535.637-225.749 569.515-821.461 0.044-0.729 0.070-1.581 0.070-2.439 0-11.734-4.737-22.362-12.403-30.075l0.002 0.002zM657.664 486.997c-15.443 15.448-36.78 25.003-60.349 25.003-47.128 0-85.333-38.205-85.333-85.333s38.205-85.333 85.333-85.333c23.569 0 44.906 9.555 60.349 25.002l0 0c15.437 15.441 24.984 36.771 24.984 60.331s-9.548 44.889-24.985 60.331l0-0z","M47.488 804.011c21.988-22.134 52.442-35.834 86.095-35.834 67.016 0 121.344 54.328 121.344 121.344 0 33.654-13.7 64.107-35.827 86.089l-0.007 0.007c-47.403 47.403-219.093 48.384-219.093 48.384s0-172.629 47.488-219.989z","M441.899 99.883c-19.601-3.582-42.158-5.631-65.193-5.631-105.117 0-200.271 42.659-269.094 111.609l-0.006 0.006c-22.251 22.451-41.797 47.646-58.068 75.015l-0.983 1.785c-3.709 6.195-5.902 13.667-5.902 21.652 0 11.791 4.783 22.465 12.515 30.188l0 0 84.864 84.907c80.614-126.65 181.178-232.842 298.486-317.218l3.381-2.313z","M924.117 582.101c3.582 19.601 5.631 42.158 5.631 65.193 0 105.117-42.659 200.271-111.609 269.094l-0.006 0.006c-22.451 22.251-47.646 41.797-75.015 58.068l-1.785 0.983c-6.195 3.709-13.667 5.902-21.652 5.902-11.791 0-22.465-4.783-30.188-12.515l-0-0-84.907-84.864c126.65-80.614 232.842-181.178 317.218-298.486l2.313-3.381z"],"attrs":[{},{},{},{}],"isMulticolor":false,"isMulticolor2":false,"grid":0,"tags":["spaceship"]},"attrs":[{},{},{},{}],"properties":{"order":42,"id":3,"name":"spaceship","prevSize":32,"code":59666},"setIdx":0,"setId":3,"iconIdx":19},{"icon":{"paths":["M512 0c-281.6 0-512 230.4-512 512s230.4 512 512 512 512-230.4 512-512c0-281.6-230.4-512-512-512zM512 640c-70.4 0-128-57.6-128-128s57.6-128 128-128 128 57.6 128 128c0 70.4-57.6 128-128 128zM512 128c57.6 0 115.2 12.8 166.4 38.4l-99.584 99.584c-48.704-13.248-84.928-13.248-133.696 0l-99.52-99.584c51.2-25.6 108.8-38.4 166.4-38.4zM128 512c0-57.6 12.8-115.2 38.4-166.4l99.584 99.584c-13.248 48.704-13.248 84.928 0 133.696l-99.584 99.52c-25.6-51.2-38.4-108.8-38.4-166.4zM512 896c-57.6 0-115.2-12.8-166.4-38.4l99.584-99.584c48.704 13.248 84.928 13.248 133.696 0l99.52 99.584c-51.2 25.6-108.8 38.4-166.4 38.4zM857.6 678.4l-99.584-99.584c13.248-48.704 13.248-84.928 0-133.696l99.584-99.52c25.6 51.2 38.4 108.8 38.4 166.4s-12.8 115.2-38.4 166.4z"],"attrs":[{}],"isMulticolor":false,"isMulticolor2":false,"grid":0,"tags":["support"]},"attrs":[{}],"properties":{"order":43,"id":2,"name":"support","prevSize":32,"code":59667},"setIdx":0,"setId":3,"iconIdx":20},{"icon":{"paths":["M277.333 469.333h469.333c128 0 234.667-106.667 234.667-234.667s-106.667-234.667-234.667-234.667h-469.333c-128 0-234.667 106.667-234.667 234.667s106.667 234.667 234.667 234.667zM277.333 85.333c81.067 0 149.333 68.267 149.333 149.333s-68.267 149.333-149.333 149.333-149.333-68.267-149.333-149.333 68.267-149.333 149.333-149.333z","M746.667 554.667h-469.333c-128 0-234.667 106.667-234.667 234.667s106.667 234.667 234.667 234.667h469.333c128 0 234.667-106.667 234.667-234.667s-106.667-234.667-234.667-234.667zM746.667 938.667c-81.067 0-149.333-68.267-149.333-149.333s68.267-149.333 149.333-149.333 149.333 68.267 149.333 149.333-68.267 149.333-149.333 149.333z"],"attrs":[{},{}],"isMulticolor":false,"isMulticolor2":false,"grid":0,"tags":["switches"]},"attrs":[{},{}],"properties":{"order":44,"id":1,"name":"switches","prevSize":32,"code":59668},"setIdx":0,"setId":3,"iconIdx":21},{"icon":{"paths":["M704 768h-640c-35.392 0-64-28.608-64-64v-640c0-35.328 28.608-64 64-64h640c35.392 0 64 28.672 64 64v640c0 35.392-28.608 64-64 64z","M960 1024h-704v-128h640v-640h128v704c0 35.392-28.608 64-64 64z"],"attrs":[{},{}],"isMulticolor":false,"isMulticolor2":false,"grid":0,"tags":["ungroup"]},"attrs":[{},{}],"properties":{"order":45,"id":0,"name":"ungroup","prevSize":32,"code":59669},"setIdx":0,"setId":3,"iconIdx":22}],"height":1024,"metadata":{"name":"argon"},"preferences":{"showGlyphs":true,"showQuickUse":true,"showQuickUse2":true,"showSVGs":true,"fontPref":{"prefix":"icon-","metadata":{"fontFamily":"argon","majorVersion":1,"minorVersion":0},"metrics":{"emSize":1024,"baseline":6.25,"whitespace":50},"embed":false,"showMetadata":false,"showVersion":false,"showMetrics":false,"showSelector":false},"imagePref":{"prefix":"icon-","png":true,"useClassSelector":true,"color":0,"bgColor":16777215,"classSelector":".icon"},"historySize":50,"showCodes":false,"gridSize":16,"showLiga":false}}
```

## File: babel.config.js

- Extension: .js
- Language: javascript
- Size: 290 bytes
- SHA: c0d6e654161ea723e5bd3eb6b2184f9aa86ab0fa
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          extensions: [".tsx", ".ts", ".js", ".json"],
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};

```

## File: components/Button.js

- Extension: .js
- Language: javascript
- Size: 1286 bytes
- SHA: 9f39f8beba5866ee479be7d656c96033b22288e0
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```javascript
import React from "react";
import { StyleSheet } from "react-native";
import PropTypes from 'prop-types';
import { Button } from "galio-framework";

import argonTheme from "../constants/Theme";

class ArButton extends React.Component {
  render() {
    const { small, shadowless, children, color, style, ...props } = this.props;
    
    const colorStyle = color && argonTheme.COLORS[color.toUpperCase()];

    const buttonStyles = [
      small && styles.smallButton,
      color && { backgroundColor: colorStyle },
      !shadowless && styles.shadow,
      {...style}
    ];

    return (
      <Button
        style={buttonStyles}
        shadowless
        textStyle={{ fontSize: 12, fontWeight: '700' }}
        {...props}
      >
        {children}
      </Button>
    );
  }
}

ArButton.propTypes = {
  small: PropTypes.bool,
  shadowless: PropTypes.bool,
  color: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.oneOf(['default', 'primary', 'secondary', 'info', 'error', 'success', 'warning'])
  ])
}

const styles = StyleSheet.create({
  smallButton: {
    width: 75,
    height: 28
  },
  shadow: {
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 4,
    shadowOpacity: 0.1,
    elevation: 2,
  },
});

export default ArButton;

```

## File: components/Card.js

- Extension: .js
- Language: javascript
- Size: 2601 bytes
- SHA: 6b7bc89df3745cbf775633996d87378e02627462
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```javascript
import React from 'react';
import { withNavigation } from '@react-navigation/compat';
import PropTypes from 'prop-types';
import { StyleSheet, Dimensions, Image, TouchableWithoutFeedback } from 'react-native';
import { Block, Text, theme } from 'galio-framework';

import { argonTheme } from '../constants';


class Card extends React.Component {
  render() {
    const { navigation, item, horizontal, full, style, ctaColor, imageStyle } = this.props;
    
    const imageStyles = [
      full ? styles.fullImage : styles.horizontalImage,
      imageStyle
    ];
    const cardContainer = [styles.card, styles.shadow, style];
    const imgContainer = [styles.imageContainer,
      horizontal ? styles.horizontalStyles : styles.verticalStyles,
      styles.shadow
    ];

    return (
      <Block row={horizontal} card flex style={cardContainer}>
        <TouchableWithoutFeedback onPress={() => navigation.navigate('Pro')}>
          <Block flex style={imgContainer}>
            <Image source={{uri: item.image}} style={imageStyles} />
          </Block>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={() => navigation.navigate('Pro')}>
          <Block flex space="between" style={styles.cardDescription}>
            <Text size={14} style={styles.cardTitle}>{item.title}</Text>
            <Text size={12} muted={!ctaColor} color={ctaColor || argonTheme.COLORS.ACTIVE} bold>{item.cta}</Text>
          </Block>
        </TouchableWithoutFeedback>
      </Block>
    );
  }
}

Card.propTypes = {
  item: PropTypes.object,
  horizontal: PropTypes.bool,
  full: PropTypes.bool,
  ctaColor: PropTypes.string,
  imageStyle: PropTypes.any,
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.COLORS.WHITE,
    marginVertical: theme.SIZES.BASE,
    borderWidth: 0,
    minHeight: 114,
    marginBottom: 16
  },
  cardTitle: {
    flex: 1,
    flexWrap: 'wrap',
    paddingBottom: 6
  },
  cardDescription: {
    padding: theme.SIZES.BASE / 2
  },
  imageContainer: {
    borderRadius: 3,
    elevation: 1,
    overflow: 'hidden',
  },
  image: {
    // borderRadius: 3,
  },
  horizontalImage: {
    height: 122,
    width: 'auto',
  },
  horizontalStyles: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  verticalStyles: {
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 0
  },
  fullImage: {
    height: 215
  },
  shadow: {
    shadowColor: theme.COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowOpacity: 0.1,
    elevation: 2,
  },
});

export default withNavigation(Card);
```

## File: components/DrawerItem.js

- Extension: .js
- Language: javascript
- Size: 3209 bytes
- SHA: 36ba69899975bcc0d243fe921f163d434e06aa78
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```javascript
import React from "react";
import { StyleSheet, TouchableOpacity, Linking } from "react-native";
import { Block, Text, theme } from "galio-framework";

import Icon from "./Icon";
import argonTheme from "../constants/Theme";

class DrawerItem extends React.Component {
  renderIcon = () => {
    const { title, focused } = this.props;

    switch (title) {
      case "Home":
        return (
          <Icon
            name="shop"
            family="ArgonExtra"
            size={14}
            color={focused ? "white" : argonTheme.COLORS.PRIMARY}
          />
        );
      case "Elements":
        return (
          <Icon
            name="map-big"
            family="ArgonExtra"
            size={14}
            color={focused ? "white" : argonTheme.COLORS.ERROR}
          />
        );
      case "Articles":
        return (
          <Icon
            name="spaceship"
            family="ArgonExtra"
            size={14}
            color={focused ? "white" : argonTheme.COLORS.PRIMARY}
          />
        );
      case "Profile":
        return (
          <Icon
            name="chart-pie-35"
            family="ArgonExtra"
            size={14}
            color={focused ? "white" : argonTheme.COLORS.WARNING}
          />
        );
      case "Account":
        return (
          <Icon
            name="calendar-date"
            family="ArgonExtra"
            size={14}
            color={focused ? "white" : argonTheme.COLORS.INFO}
          />
        );
      case "Getting Started":
        return (<Icon
          name="spaceship"
          family="ArgonExtra"
          size={14}
          color={focused ? "white" : "rgba(0,0,0,0.5)"}
        />);
      case "Log out":
        return <Icon />;
      default:
        return null;
    }
  };

  render() {
    const { focused, title, navigation } = this.props;

    const containerStyles = [
      styles.defaultStyle,
      focused ? [styles.activeStyle, styles.shadow] : null
    ];

    return (
      <TouchableOpacity
        style={{ height: 60 }}
        onPress={() =>
          title == "Getting Started"
            ? Linking.openURL(
                "https://demos.creative-tim.com/argon-pro-react-native/docs/"
              ).catch(err => console.error("An error occurred", err))
            : navigation.navigate(title)
        }
      >
        <Block flex row style={containerStyles}>
          <Block middle flex={0.1} style={{ marginRight: 5 }}>
            {this.renderIcon()}
          </Block>
          <Block row center flex={0.9}>
            <Text
              size={15}
              bold={focused ? true : false}
              color={focused ? "white" : "rgba(0,0,0,0.5)"}
            >
              {title}
            </Text>
          </Block>
        </Block>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  defaultStyle: {
    paddingVertical: 16,
    paddingHorizontal: 16
  },
  activeStyle: {
    backgroundColor: argonTheme.COLORS.ACTIVE,
    borderRadius: 4
  },
  shadow: {
    shadowColor: theme.COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowRadius: 8,
    shadowOpacity: 0.1
  }
});

export default DrawerItem;

```

## File: components/Header.js

- Extension: .js
- Language: javascript
- Size: 8649 bytes
- SHA: 207c7e841e76615b635a48c472211fc00eff1deb
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```javascript
import React from 'react';
import { withNavigation } from '@react-navigation/compat';
import { TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { Button, Block, NavBar, Text, theme } from 'galio-framework';

import Icon from './Icon';
import Input from './Input';
import Tabs from './Tabs';
import argonTheme from '../constants/Theme';

const { height, width } = Dimensions.get('window');
const iPhoneX = () => Platform.OS === 'ios' && (height === 812 || width === 812 || height === 896 || width === 896);

const BellButton = ({isWhite, style, navigation}) => (
  <TouchableOpacity style={[styles.button, style]} onPress={() => navigation.navigate('Pro')}>
    <Icon
      family="ArgonExtra"
      size={16}
      name="bell"
      color={argonTheme.COLORS[isWhite ? 'WHITE' : 'ICON']}
    />
    <Block middle style={styles.notify} />
  </TouchableOpacity>
);

const BasketButton = ({isWhite, style, navigation}) => (
  <TouchableOpacity style={[styles.button, style]} onPress={() => navigation.navigate('Pro')}>
    <Icon
      family="ArgonExtra"
      size={16}
      name="basket"
      color={argonTheme.COLORS[isWhite ? 'WHITE' : 'ICON']}
    />
  </TouchableOpacity>
);

const SearchButton = ({isWhite, style, navigation}) => (
  <TouchableOpacity style={[styles.button, style]} onPress={() => navigation.navigate('Pro')}>
    <Icon
      size={16}
      family="Galio"
      name="search-zoom-in"
      color={theme.COLORS[isWhite ? 'WHITE' : 'ICON']}
    />
  </TouchableOpacity>
);

class Header extends React.Component {
  handleLeftPress = () => {
    const { back, navigation } = this.props;
    return (back ? navigation.goBack() : navigation.openDrawer());
  }
  renderRight = () => {
    const { white, title, navigation } = this.props;

    if (title === 'Title') {
      return [
        <BellButton key='chat-title' navigation={navigation} isWhite={white} />,
        <BasketButton key='basket-title' navigation={navigation} isWhite={white} />
      ]
    }

    switch (title) {
      case 'Home':
        return ([
          <BellButton key='chat-home' navigation={navigation} isWhite={white} />,
          <BasketButton key='basket-home' navigation={navigation} isWhite={white} />
        ]);
      case 'Deals':
        return ([
          <BellButton key='chat-categories' navigation={navigation} />,
          <BasketButton key='basket-categories' navigation={navigation} />
        ]);
      case 'Categories':
        return ([
          <BellButton key='chat-categories' navigation={navigation} isWhite={white} />,
          <BasketButton key='basket-categories' navigation={navigation} isWhite={white} />
        ]);
      case 'Category':
        return ([
          <BellButton key='chat-deals' navigation={navigation} isWhite={white} />,
          <BasketButton key='basket-deals' navigation={navigation} isWhite={white} />
        ]);
      case 'Profile':
        return ([
          <BellButton key='chat-profile' navigation={navigation} isWhite={white} />,
          <BasketButton key='basket-deals' navigation={navigation} isWhite={white} />
        ]);
      case 'Product':
        return ([
          <SearchButton key='search-product' navigation={navigation} isWhite={white} />,
          <BasketButton key='basket-product' navigation={navigation} isWhite={white} />
        ]);
      case 'Search':
        return ([
          <BellButton key='chat-search' navigation={navigation} isWhite={white} />,
          <BasketButton key='basket-search' navigation={navigation} isWhite={white} />
        ]);
      case 'Settings':
        return ([
          <BellButton key='chat-search' navigation={navigation} isWhite={white} />,
          <BasketButton key='basket-search' navigation={navigation} isWhite={white} />
        ]);
      default:
        break;
    }
  }
  renderSearch = () => {
    const { navigation } = this.props;
    return (
      <Input
        right
        color="black"
        style={styles.search}
        placeholder="What are you looking for?"
        placeholderTextColor={'#8898AA'}
        onFocus={() => navigation.navigate('Pro')}
        iconContent={<Icon size={16} color={theme.COLORS.MUTED} name="search-zoom-in" family="ArgonExtra" />}
      />
    );
  }
  renderOptions = () => {
    const { navigation, optionLeft, optionRight } = this.props;

    return (
      <Block row style={styles.options}>
        <Button shadowless style={[styles.tab, styles.divider]} onPress={() => navigation.navigate('Pro')}>
          <Block row middle>
            <Icon name="diamond" family="ArgonExtra" style={{ paddingRight: 8 }} color={argonTheme.COLORS.ICON} />
            <Text size={16} style={styles.tabTitle}>{optionLeft || 'Beauty'}</Text>
          </Block>
        </Button>
        <Button shadowless style={styles.tab} onPress={() => navigation.navigate('Pro')}>
          <Block row middle>
            <Icon size={16} name="bag-17" family="ArgonExtra" style={{ paddingRight: 8 }} color={argonTheme.COLORS.ICON}/>
            <Text size={16} style={styles.tabTitle}>{optionRight || 'Fashion'}</Text>
          </Block>
        </Button>
      </Block>
    );
  }
  renderTabs = () => {
    const { tabs, tabIndex, navigation } = this.props;
    const defaultTab = tabs && tabs[0] && tabs[0].id;
    
    if (!tabs) return null;

    return (
      <Tabs
        data={tabs || []}
        initialIndex={tabIndex || defaultTab}
        onChange={id => navigation.setParams({ tabId: id })} />
    )
  }
  renderHeader = () => {
    const { search, options, tabs } = this.props;
    if (search || tabs || options) {
      return (
        <Block center>
          {search ? this.renderSearch() : null}
          {options ? this.renderOptions() : null}
          {tabs ? this.renderTabs() : null}
        </Block>
      );
    }
  }
  render() {
    const { back, title, white, transparent, bgColor, iconColor, titleColor, navigation, ...props } = this.props;

    const noShadow = ['Search', 'Categories', 'Deals', 'Pro', 'Profile'].includes(title);
    const headerStyles = [
      !noShadow ? styles.shadow : null,
      transparent ? { backgroundColor: 'rgba(0,0,0,0)' } : null,
    ];

    const navbarStyles = [
      styles.navbar,
      bgColor && { backgroundColor: bgColor }
    ];

    return (
      <Block style={headerStyles}>
        <NavBar
          back={false}
          title={title}
          style={navbarStyles}
          transparent={transparent}
          right={this.renderRight()}
          rightStyle={{ alignItems: 'center' }}
          left={
            <Icon 
              name={back ? 'chevron-left' : "menu"} family="entypo" 
              size={20} onPress={this.handleLeftPress} 
              color={iconColor || (white ? argonTheme.COLORS.WHITE : argonTheme.COLORS.ICON)}
              style={{ marginTop: 2 }}
            />
              
          }
          leftStyle={{ paddingVertical: 12, flex: 0.2 }}
          titleStyle={[
            styles.title,
            { color: argonTheme.COLORS[white ? 'WHITE' : 'HEADER'] },
            titleColor && { color: titleColor }
          ]}
          {...props}
        />
        {this.renderHeader()}
      </Block>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    padding: 12,
    position: 'relative',
  },
  title: {
    width: '100%',
    fontSize: 16,
    fontWeight: 'bold',
  },
  navbar: {
    paddingVertical: 0,
    paddingBottom: theme.SIZES.BASE * 1.5,
    paddingTop: iPhoneX ? theme.SIZES.BASE * 4 : theme.SIZES.BASE,
    zIndex: 5,
  },
  shadow: {
    backgroundColor: theme.COLORS.WHITE,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    shadowOpacity: 0.2,
    elevation: 3,
  },
  notify: {
    backgroundColor: argonTheme.COLORS.LABEL,
    borderRadius: 4,
    height: theme.SIZES.BASE / 2,
    width: theme.SIZES.BASE / 2,
    position: 'absolute',
    top: 9,
    right: 12,
  },
  header: {
    backgroundColor: theme.COLORS.WHITE,
  },
  divider: {
    borderRightWidth: 0.3,
    borderRightColor: theme.COLORS.ICON,
  },
  search: {
    height: 48,
    width: width - 32,
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 3,
    borderColor: argonTheme.COLORS.BORDER
  },
  options: {
    marginBottom: 24,
    marginTop: 10,
    elevation: 4,
  },
  tab: {
    backgroundColor: theme.COLORS.TRANSPARENT,
    width: width * 0.35,
    borderRadius: 0,
    borderWidth: 0,
    height: 24,
    elevation: 0,
  },
  tabTitle: {
    lineHeight: 19,
    fontWeight: '400',
    color: argonTheme.COLORS.HEADER
  },
});

export default withNavigation(Header);

```

## File: components/Icon.js

- Extension: .js
- Language: javascript
- Size: 921 bytes
- SHA: 075515c84b8b0aec93ff5ea7815116511b37b421
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```javascript
import React from 'react';
import * as Font from 'expo-font';
import { createIconSetFromIcoMoon } from '@expo/vector-icons';
import { Icon } from 'galio-framework';

import argonConfig from '../assets/config/argon.json';
const ArgonExtra = require('../assets/font/argon.ttf');
const IconArgonExtra = createIconSetFromIcoMoon(argonConfig, 'ArgonExtra');

class IconExtra extends React.Component {
  state = {
    fontLoaded: false,
  }

  async componentDidMount() {
    await Font.loadAsync({ ArgonExtra: ArgonExtra });
    this.setState({ fontLoaded: true });
  }

  render() {
    const { name, family, ...rest } = this.props;
    
    if (name && family && this.state.fontLoaded) {
      if (family === 'ArgonExtra') {
        return <IconArgonExtra name={name} family={family} {...rest} />;
      }
      return <Icon name={name} family={family} {...rest} />;
    }

    return null;
  }
}

export default IconExtra;

```

## File: components/Input.js

- Extension: .js
- Language: javascript
- Size: 1607 bytes
- SHA: ee890229613faee19adc8d5c27c34e55c8545f06
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```javascript
import React from "react";
import { StyleSheet } from "react-native";
import PropTypes from 'prop-types';

import { Input } from "galio-framework";

import Icon from './Icon';
import { argonTheme } from "../constants";

class ArInput extends React.Component {
  render() {
    const { shadowless, success, error } = this.props;

    const inputStyles = [
      styles.input,
      !shadowless && styles.shadow,
      success && styles.success,
      error && styles.error,
      {...this.props.style}
    ];

    return (
      <Input
        placeholder="write something here"
        placeholderTextColor={argonTheme.COLORS.MUTED}
        style={inputStyles}
        color={argonTheme.COLORS.HEADER}
        iconContent={
          <Icon
            size={14}
            color={argonTheme.COLORS.ICON}
            name="link"
            family="AntDesign"
          />
        }
        {...this.props}
      />
    );
  }
}

ArInput.defaultProps = {
  shadowless: false,
  success: false,
  error: false
};

ArInput.propTypes = {
  shadowless: PropTypes.bool,
  success: PropTypes.bool,
  error: PropTypes.bool
}

const styles = StyleSheet.create({
  input: {
    borderRadius: 4,
    borderColor: argonTheme.COLORS.BORDER,
    height: 44,
    backgroundColor: '#FFFFFF'
  },
  success: {
    borderColor: argonTheme.COLORS.INPUT_SUCCESS,
  },
  error: {
    borderColor: argonTheme.COLORS.INPUT_ERROR,
  },
  shadow: {
    shadowColor: argonTheme.COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 0.05,
    elevation: 2,
  }
});

export default ArInput;

```

## File: components/Select.js

- Extension: .js
- Language: javascript
- Size: 2068 bytes
- SHA: f18b3f8d21a8b0f5071589d0e0bb2825e160871e
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```javascript
import React from 'react';
import { StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import ModalDropdown from 'react-native-modal-dropdown';
import { Block, Text } from 'galio-framework';

import Icon from './Icon';
import { argonTheme } from '../constants';

class DropDown extends React.Component {
  state = {
    value: 1,
  }

  handleOnSelect = (index, value) => {
    const { onSelect } = this.props;

    this.setState({ value: value });
    onSelect && onSelect(index, value);
  }

  render() {
    const { onSelect, iconName, iconFamily, iconSize, iconColor, color, textStyle, style, ...props } = this.props;

    const modalStyles = [
      styles.qty,
      color && { backgroundColor: color },
      style
    ];

    const textStyles = [
      styles.text,
      textStyle
    ];

    return (
      <ModalDropdown
        style={modalStyles}
        onSelect={this.handleOnSelect}
        dropdownStyle={styles.dropdown}
        dropdownTextStyle={{paddingLeft:16, fontSize:12}}
        {...props}>
        <Block flex row middle space="between">
          <Text size={12} style={textStyles}>{this.state.value}</Text>
          <Icon name={iconName || "nav-down"} family={iconFamily || "ArgonExtra"} size={iconSize || 10} color={iconColor || argonTheme.COLORS.WHITE} />
        </Block>
      </ModalDropdown>
    )
  }
}

DropDown.propTypes = {
  onSelect: PropTypes.func,
  iconName: PropTypes.string,
  iconFamily: PropTypes.string,
  iconSize: PropTypes.number,
  color: PropTypes.string,
  textStyle: PropTypes.any,
};

const styles = StyleSheet.create({
  qty: {
    width: 100,
    backgroundColor: argonTheme.COLORS.DEFAULT,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom:9.5,
    borderRadius: 4,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowOpacity: 1,
  },
  text: {
    color: argonTheme.COLORS.WHITE,
    fontWeight: '600'
  },
  dropdown: {
    marginTop: 8,
    marginLeft: -16,
    width: 100,
  },
});

export default DropDown;

```

## File: components/Switch.js

- Extension: .js
- Language: javascript
- Size: 680 bytes
- SHA: 53146832b37d2f9d52e90fbb46e6e7c722f18371
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```javascript
import React from 'react';
import { Switch, Platform } from 'react-native';

import argonTheme from '../constants/Theme';

class MkSwitch extends React.Component {
  render() {
    const { value, ...props } = this.props;
    const thumbColor = Platform.OS === 'ios' ? null :
      Platform.OS === 'android' && value ? argonTheme.COLORS.SWITCH_ON : argonTheme.COLORS.SWITCH_OFF;

    return (
      <Switch
        value={value}
        thumbColor={thumbColor}
        ios_backgroundColor={argonTheme.COLORS.SWITCH_OFF}
        trackColor={{ false: argonTheme.COLORS.SWITCH_ON, true: argonTheme.COLORS.SWITCH_ON }}
        {...props}
      />
    );
  }
}

export default MkSwitch;
```

## File: components/Tabs.js

- Extension: .js
- Language: javascript
- Size: 3648 bytes
- SHA: bcf286213b6ed0e1d46101b99fbbf55a30d7ef1e
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```javascript
import React from 'react';
import { StyleSheet, Dimensions, FlatList, Animated } from 'react-native';
import { Block, theme } from 'galio-framework';

const { width } = Dimensions.get('screen');
import argonTheme from '../constants/Theme';

const defaultMenu = [
  { id: 'popular', title: 'Popular', },
  { id: 'beauty', title: 'Beauty', },
  { id: 'cars', title: 'Cars', },
  { id: 'motocycles', title: 'Motocycles', },
];

export default class Tabs extends React.Component {
  static defaultProps = {
    data: defaultMenu,
    initialIndex: null,
  }

  state = {
    active: null,
  }

  componentDidMount() {
    const { initialIndex } = this.props;
    initialIndex && this.selectMenu(initialIndex);
  }

  animatedValue = new Animated.Value(1);

  animate() {
    this.animatedValue.setValue(0);

    Animated.timing(this.animatedValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false, // color not supported
    }).start()
  }

  menuRef = React.createRef();

  onScrollToIndexFailed = () => {
    this.menuRef.current.scrollToIndex({
      index: 0,
      viewPosition: 0.5
    });
  }

  selectMenu = (id) => {
    this.setState({ active: id });

    this.menuRef.current.scrollToIndex({
      index: this.props.data.findIndex(item => item.id === id),
      viewPosition: 0.5
    });

    this.animate();
    this.props.onChange && this.props.onChange(id);
  }

  renderItem = (item) => {
    const isActive = this.state.active === item.id;

    const textColor = this.animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [argonTheme.COLORS.BLACK, isActive ? argonTheme.COLORS.WHITE : argonTheme.COLORS.BLACK],
      extrapolate: 'clamp',
    });
    
    const containerStyles = [
      styles.titleContainer,
      !isActive && { backgroundColor: argonTheme.COLORS.SECONDARY },
      isActive && styles.containerShadow
    ];

    return (
      <Block style={containerStyles}>
        <Animated.Text
          style={[
            styles.menuTitle,
            { color: textColor }
          ]}
          onPress={() => this.selectMenu(item.id)}>
          {item.title}
        </Animated.Text>
      </Block>
    )
  }

  renderMenu = () => {
    const { data, ...props } = this.props;

    return (
      <FlatList
        {...props}
        data={data}
        horizontal={true}
        ref={this.menuRef}
        extraData={this.state}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        onScrollToIndexFailed={this.onScrollToIndexFailed}
        renderItem={({ item }) => this.renderItem(item)}
        contentContainerStyle={styles.menu}
      />
    )
  }

  render() {
    return (
      <Block style={styles.container}>
        {this.renderMenu()}
      </Block>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    width: width,
    backgroundColor: theme.COLORS.WHITE,
    zIndex: 2,
  },
  shadow: {
    shadowColor: theme.COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowOpacity: 0.2,
    elevation: 4,
  },
  menu: {
    paddingHorizontal: theme.SIZES.BASE * 2.5,
    paddingTop: 8,
    paddingBottom: 16,
  },
  titleContainer: {
    alignItems: 'center',
    backgroundColor: argonTheme.COLORS.ACTIVE,
    borderRadius: 4,
    marginRight: 9
  },
  containerShadow: {
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowOpacity: 0.1,
    elevation: 1,
  },
  menuTitle: {
    fontWeight: '600',
    fontSize: 14,
    // lineHeight: 28,
    paddingVertical: 10,
    paddingHorizontal: 16,
    color: argonTheme.COLORS.MUTED
  },
});

```

## File: components/index.js

- Extension: .js
- Language: javascript
- Size: 337 bytes
- SHA: d9410658bbb127b33ba9c9229f8a1b787e43f86c
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```javascript
import Button from './Button';
import Card from './Card';
import DrawerItem from './DrawerItem';
import Icon from './Icon';
import Header from './Header';
import Input from './Input';
import Switch from './Switch';
import Select from './Select';

export {
  Button,
  Card,
  DrawerItem,
  Icon,
  Input,
  Header,
  Switch, 
  Select
};
```

## File: constants/Images.js

- Extension: .js
- Language: javascript
- Size: 1589 bytes
- SHA: 0e9b5121a873017f0768ac8840c41145cdbe4e87
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```javascript
// local imgs
const Onboarding = require("../assets/imgs/bg.png");
const Logo = require("../assets/imgs/argon-logo.png");
const LogoOnboarding = require("../assets/imgs/argon-logo-onboarding.png");
const ProfileBackground = require("../assets/imgs/profile-screen-bg.png");
const RegisterBackground = require("../assets/imgs/register-bg.png");
const Pro = require("../assets/imgs/getPro-bg.png");
const ArgonLogo = require("../assets/imgs/argonlogo.png");
const iOSLogo = require("../assets/imgs/ios.png");
const androidLogo = require("../assets/imgs/android.png");
// internet imgs

const ProfilePicture = 'https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?fit=crop&w=1650&q=80';

const Viewed = [
  'https://images.unsplash.com/photo-1501601983405-7c7cabaa1581?fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1543747579-795b9c2c3ada?fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1551798507-629020c81463?fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1503642551022-c011aafb3c88?fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1482686115713-0fbcaced6e28?fit=crop&w=240&q=80',
];

const Products = {
  'View article': 'https://images.unsplash.com/photo-1501601983405-7c7cabaa1581?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=840&q=840',
};

export default {
  Onboarding,
  Logo,
  LogoOnboarding,
  ProfileBackground,
  ProfilePicture,
  RegisterBackground,
  Viewed,
  Products,
  Pro,
  ArgonLogo,
  iOSLogo,
  androidLogo
};
```

## File: constants/Theme.js

- Extension: .js
- Language: javascript
- Size: 755 bytes
- SHA: d22100d9dbf4e1686845b19521f96ecfa78a1c4b
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```javascript
export default {
  COLORS: {
    DEFAULT: '#172B4D',
    PRIMARY: '#5E72E4',
    SECONDARY: '#F7FAFC',
    LABEL: '#FE2472',
    INFO: '#11CDEF',
    ERROR: '#F5365C',
    SUCCESS: '#2DCE89',
    WARNING: '#FB6340',
    /*not yet changed */
    MUTED: '#ADB5BD',
    INPUT: '#DCDCDC',
    INPUT_SUCCESS: '#7BDEB2',
    INPUT_ERROR: '#FCB3A4',
    ACTIVE: '#5E72E4', //same as primary
    BUTTON_COLOR: '#9C26B0', //wtf
    PLACEHOLDER: '#9FA5AA',
    SWITCH_ON: '#5E72E4',
    SWITCH_OFF: '#D4D9DD',
    GRADIENT_START: '#6B24AA',
    GRADIENT_END: '#AC2688',
    PRICE_COLOR: '#EAD5FB',
    BORDER_COLOR: '#E7E7E7',
    BLOCK: '#E7E7E7',
    ICON: '#172B4D',
    HEADER: '#525F7F',
    BORDER: '#CAD1D7',
    WHITE: '#FFFFFF',
    BLACK: '#000000'
  }
};
```

## File: constants/articles.js

- Extension: .js
- Language: javascript
- Size: 1171 bytes
- SHA: 9186194655faa5907a400b202ac883f3d0fb366d
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```javascript
export default [
  {
    title: 'Ice cream is made with carrageenan …',
    image: 'https://images.unsplash.com/photo-1516559828984-fb3b99548b21?ixlib=rb-1.2.1&auto=format&fit=crop&w=2100&q=80',
    cta: 'View article', 
    horizontal: true
  },
  {
    title: 'Is makeup one of your daily esse …',
    image: 'https://images.unsplash.com/photo-1519368358672-25b03afee3bf?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2004&q=80',
    cta: 'View article'
  },
  {
    title: 'Coffee is more than just a drink: It’s …',
    image: 'https://images.unsplash.com/photo-1500522144261-ea64433bbe27?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2102&q=80',
    cta: 'View article' 
  },
  {
    title: 'Fashion is a popular style, especially in …',
    image: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1326&q=80',
    cta: 'View article' 
  },
  {
    title: 'Argon is a great free UI packag …',
    image: 'https://images.unsplash.com/photo-1482686115713-0fbcaced6e28?fit=crop&w=1947&q=80',
    cta: 'View article', 
    horizontal: true
  },
];
```

## File: constants/index.js

- Extension: .js
- Language: javascript
- Size: 183 bytes
- SHA: 1a834fc8105fb3a6a4959d88b95af5b4155f5ea5
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```javascript
import argonTheme from './Theme';
import articles from './articles';
import Images from './Images';
import tabs from './tabs';

export {
  articles, 
  argonTheme,
  Images,
  tabs
};
```

## File: constants/tabs.js

- Extension: .js
- Language: javascript
- Size: 224 bytes
- SHA: 149657f4f6c85466e099420fbcd847ed3c0f433a
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```javascript
export default tabs = {
  categories: [
    { id: 'popular', title: 'Popular' },
    { id: 'beauty', title: 'Beauty' },
    { id: 'fashion', title: 'Fashion' },
    { id: 'car_motorcycle', title: 'Car & Motorcycle' },
  ],
}
```

## File: constants/utils.js

- Extension: .js
- Language: javascript
- Size: 311 bytes
- SHA: 561e5cfc4b8369597660e3576206912442425551
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```javascript
import { Platform, StatusBar } from 'react-native';
import { theme } from 'galio-framework';

export const StatusHeight = StatusBar.currentHeight;
export const HeaderHeight = (theme.SIZES.BASE * 3.5 + (StatusHeight || 0));
export const iPhoneX = () => Platform.OS === 'ios' && (height === 812 || width === 812);
```

## File: navigation/Menu.js

- Extension: .js
- Language: javascript
- Size: 1988 bytes
- SHA: fda94f77f45f57a2a84d1718417b9496cc4f649f
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```javascript
import { Block, Text, theme } from "galio-framework";
import { Image, ScrollView, StyleSheet } from "react-native";

import { DrawerItem as DrawerCustomItem } from "../components";
import Images from "../constants/Images";
import React from "react";

function CustomDrawerContent({
  drawerPosition,
  navigation,
  profile,
  focused,
  state,
  ...rest
}) {
  const screens = ["Home", "Profile", "Account", "Elements", "Articles"];
  return (
    <Block
      style={styles.container}
      forceInset={{ top: "always", horizontal: "never" }}
    >
      <Block flex={0.06} style={styles.header}>
        <Image styles={styles.logo} source={Images.Logo} />
      </Block>
      <Block flex style={{ paddingLeft: 8, paddingRight: 14 }}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {screens.map((item, index) => {
            return (
              <DrawerCustomItem
                title={item}
                key={index}
                navigation={navigation}
                focused={state.index === index ? true : false}
              />
            );
          })}
          <Block
            flex
            style={{ marginTop: 24, marginVertical: 8, paddingHorizontal: 8 }}
          >
            <Block
              style={{
                borderColor: "rgba(0,0,0,0.2)",
                width: "100%",
                borderWidth: StyleSheet.hairlineWidth,
              }}
            />
            <Text color="#8898AA" style={{ marginTop: 16, marginLeft: 8 }}>
              DOCUMENTATION
            </Text>
          </Block>
          <DrawerCustomItem title="Getting Started" navigation={navigation} />
        </ScrollView>
      </Block>
    </Block>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 28,
    paddingBottom: theme.SIZES.BASE,
    paddingTop: theme.SIZES.BASE * 3,
    justifyContent: "center",
  },
});

export default CustomDrawerContent;

```

## File: navigation/Screens.js

- Extension: .js
- Language: javascript
- Size: 6724 bytes
- SHA: db91d65b6957811e389f36db0d9f7bd4407a253c
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```javascript
import { Animated, Dimensions, Easing } from "react-native";
// header for screens
import { Header, Icon } from "../components";
import { argonTheme, tabs } from "../constants";

import Articles from "../screens/Articles";
import { Block } from "galio-framework";
// drawer
import CustomDrawerContent from "./Menu";
import Elements from "../screens/Elements";
// screens
import Home from "../screens/Home";
import Onboarding from "../screens/Onboarding";
import Pro from "../screens/Pro";
import Profile from "../screens/Profile";
import React from "react";
import Register from "../screens/Register";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createStackNavigator } from "@react-navigation/stack";

const { width } = Dimensions.get("screen");

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

function ElementsStack(props) {
  return (
    <Stack.Navigator
      screenOptions={{
        mode: "card",
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Elements"
        component={Elements}
        options={{
          header: ({ navigation, scene }) => (
            <Header title="Elements" navigation={navigation} scene={scene} />
          ),
          cardStyle: { backgroundColor: "#F8F9FE" },
        }}
      />
      <Stack.Screen
        name="Pro"
        component={Pro}
        options={{
          header: ({ navigation, scene }) => (
            <Header
              title=""
              back
              white
              transparent
              navigation={navigation}
              scene={scene}
            />
          ),
          headerTransparent: true,
        }}
      />
    </Stack.Navigator>
  );
}

function ArticlesStack(props) {
  return (
    <Stack.Navigator
      screenOptions={{
        mode: "card",
        headerShown: "screen",
      }}
    >
      <Stack.Screen
        name="Articles"
        component={Articles}
        options={{
          header: ({ navigation, scene }) => (
            <Header title="Articles" navigation={navigation} scene={scene} />
          ),
          cardStyle: { backgroundColor: "#F8F9FE" },
        }}
      />
      <Stack.Screen
        name="Pro"
        component={Pro}
        options={{
          header: ({ navigation, scene }) => (
            <Header
              title=""
              back
              white
              transparent
              navigation={navigation}
              scene={scene}
            />
          ),
          headerTransparent: true,
        }}
      />
    </Stack.Navigator>
  );
}

function ProfileStack(props) {
  return (
    <Stack.Navigator
      initialRouteName="Profile"
      screenOptions={{
        mode: "card",
        headerShown: "screen",
      }}
    >
      <Stack.Screen
        name="Profile"
        component={Profile}
        options={{
          header: ({ navigation, scene }) => (
            <Header
              transparent
              white
              title="Profile"
              navigation={navigation}
              scene={scene}
            />
          ),
          cardStyle: { backgroundColor: "#FFFFFF" },
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="Pro"
        component={Pro}
        options={{
          header: ({ navigation, scene }) => (
            <Header
              title=""
              back
              white
              transparent
              navigation={navigation}
              scene={scene}
            />
          ),
          headerTransparent: true,
        }}
      />
    </Stack.Navigator>
  );
}

function HomeStack(props) {
  return (
    <Stack.Navigator
      screenOptions={{
        mode: "card",
        headerShown: "screen",
      }}
    >
      <Stack.Screen
        name="Home"
        component={Home}
        options={{
          header: ({ navigation, scene }) => (
            <Header
              title="Home"
              search
              options
              navigation={navigation}
              scene={scene}
            />
          ),
          cardStyle: { backgroundColor: "#F8F9FE" },
        }}
      />
      <Stack.Screen
        name="Pro"
        component={Pro}
        options={{
          header: ({ navigation, scene }) => (
            <Header
              title=""
              back
              white
              transparent
              navigation={navigation}
              scene={scene}
            />
          ),
          headerTransparent: true,
        }}
      />
    </Stack.Navigator>
  );
}

export default function OnboardingStack(props) {
  return (
    <Stack.Navigator
      screenOptions={{
        mode: "card",
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Onboarding"
        component={Onboarding}
        option={{
          headerTransparent: true,
        }}
      />
      <Stack.Screen name="App" component={AppStack} />
    </Stack.Navigator>
  );
}

function AppStack(props) {
  return (
    <Drawer.Navigator
      style={{ flex: 1 }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      drawerStyle={{
        backgroundColor: "white",
        width: width * 0.8,
      }}
      drawerContentOptions={{
        activeTintcolor: "white",
        inactiveTintColor: "#000",
        activeBackgroundColor: "transparent",
        itemStyle: {
          width: width * 0.75,
          backgroundColor: "transparent",
          paddingVertical: 16,
          paddingHorizonal: 12,
          justifyContent: "center",
          alignContent: "center",
          alignItems: "center",
          overflow: "hidden",
        },
        labelStyle: {
          fontSize: 18,
          marginLeft: 12,
          fontWeight: "normal",
        },
      }}
      initialRouteName="Home"
    >
      <Drawer.Screen
        name="Home"
        component={HomeStack}
        options={{
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="Account"
        component={Register}
        options={{
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="Elements"
        component={ElementsStack}
        options={{
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="Articles"
        component={ArticlesStack}
        options={{
          headerShown: false,
        }}
      />
    </Drawer.Navigator>
  );
}

```

## File: package.json

- Extension: .json
- Language: json
- Size: 2062 bytes
- SHA: ee75f806ae7cf10d70d587be603351afc442022b
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```json
{
  "name": "argon-react-native",
  "version": "1.9.0",
  "description": "Argon React Native, based on Argon Design System. Coded by Creative Tim",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "eject": "expo eject"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/creativetimofficial/argon-react-native.git"
  },
  "dependencies": {
    "@react-native-masked-view/masked-view": "0.2.8",
    "@react-navigation/bottom-tabs": "^6.3.1",
    "@react-navigation/compat": "^5.1.25",
    "@react-navigation/drawer": "6.4.1",
    "@react-navigation/native": "^6.0.10",
    "@react-navigation/stack": "^6.2.1",
    "@use-expo/font": "^2.0.0",
    "expo": "^48.0.16",
    "expo-app-loading": "~2.0.0",
    "expo-asset": "~8.9.1",
    "expo-font": "~11.1.1",
    "expo-modules-core": "~1.2.7",
    "expo-splash-screen": "^0.18.2",
    "galio-framework": "^0.8.0",
    "prop-types": "^15.7.2",
    "react": "18.2.0",
    "react-native": "0.71.8",
    "react-native-gesture-handler": "~2.9.0",
    "react-native-modal-dropdown": "1.0.2",
    "react-native-reanimated": "~2.14.4",
    "react-native-safe-area-context": "4.5.0",
    "react-native-screens": "~3.20.0"
  },
  "devDependencies": {
    "babel-preset-expo": "^9.3.0"
  },
  "keywords": [
    "argon react native",
    "argon design system",
    "argon app react native",
    "argon iOS",
    "react native iOS",
    "creative tim",
    "argon Android",
    "react native ui kit",
    "react native expo",
    "freebie",
    "react native argon design",
    "react native galio",
    "galio argon free",
    "galio react native free app",
    "argon expo react native",
    "react native ui template"
  ],
  "author": "Creative Tim <hello@creative-tim.com> (https://www.creative-tim.com/)",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/creativetimofficial/argon-react-native/issues"
  },
  "homepage": "https://demos.creative-tim.com/argon-react-native"
}

```

## File: screens/Articles.js

- Extension: .js
- Language: javascript
- Size: 6940 bytes
- SHA: ecb6d4172277a54f99b311f43a64b4e8b304d5b4
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```javascript
//galio
import { Block, Text, theme } from "galio-framework";
import {
  Dimensions,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
//argon
import { Images, argonTheme, articles } from "../constants/";

import { Card } from "../components/";
import React from "react";

const { width } = Dimensions.get("screen");

const thumbMeasure = (width - 48 - 32) / 3;
const cardWidth = width - theme.SIZES.BASE * 2;
const categories = [
  {
    title: "Music Album",
    description:
      "Rock music is a genre of popular music. It developed during and after the 1960s in the United Kingdom.",
    image:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?fit=crop&w=840&q=80",
    price: "$125",
  },
  {
    title: "Events",
    description:
      "Rock music is a genre of popular music. It developed during and after the 1960s in the United Kingdom.",
    image:
      "https://images.unsplash.com/photo-1543747579-795b9c2c3ada?fit=crop&w=840&q=80",
    price: "$35",
  },
];

class Articles extends React.Component {
  renderProduct = (item, index) => {
    const { navigation } = this.props;

    return (
      <TouchableWithoutFeedback
        style={{ zIndex: 3 }}
        key={`product-${item.title}`}
        onPress={() => navigation.navigate("Pro", { product: item })}
      >
        <Block center style={styles.productItem}>
          <Image
            resizeMode="cover"
            style={styles.productImage}
            source={{ uri: item.image }}
          />
          <Block center style={{ paddingHorizontal: theme.SIZES.BASE }}>
            <Text
              center
              size={16}
              color={theme.COLORS.MUTED}
              style={styles.productPrice}
            >
              {item.price}
            </Text>
            <Text center size={34}>
              {item.title}
            </Text>
            <Text
              center
              size={16}
              color={theme.COLORS.MUTED}
              style={styles.productDescription}
            >
              {item.description}
            </Text>
          </Block>
        </Block>
      </TouchableWithoutFeedback>
    );
  };

  renderCards = () => {
    return (
      <Block flex style={styles.group}>
        <Text bold size={16} style={styles.title}>
          Cards
        </Text>
        <Block flex>
          <Block style={{ paddingHorizontal: theme.SIZES.BASE }}>
            <Card item={articles[0]} horizontal />
            <Block flex row>
              <Card
                item={articles[1]}
                style={{ marginRight: theme.SIZES.BASE }}
              />
              <Card item={articles[2]} />
            </Block>
            <Card item={articles[4]} full />
            <Block flex card shadow style={styles.category}>
              <ImageBackground
                source={{ uri: Images.Products["View article"] }}
                style={[
                  styles.imageBlock,
                  { width: width - theme.SIZES.BASE * 2, height: 252 },
                ]}
                imageStyle={{
                  width: width - theme.SIZES.BASE * 2,
                  height: 252,
                }}
              >
                <Block style={styles.categoryTitle}>
                  <Text size={18} bold color={theme.COLORS.WHITE}>
                    View article
                  </Text>
                </Block>
              </ImageBackground>
            </Block>
          </Block>
          <Block flex style={{ marginTop: theme.SIZES.BASE / 2 }}>
            <ScrollView
              horizontal={true}
              pagingEnabled={true}
              decelerationRate={0}
              scrollEventThrottle={16}
              snapToAlignment="center"
              showsHorizontalScrollIndicator={false}
              snapToInterval={cardWidth + theme.SIZES.BASE * 0.375}
              contentContainerStyle={{
                paddingHorizontal: theme.SIZES.BASE / 2,
              }}
            >
              {categories &&
                categories.map((item, index) =>
                  this.renderProduct(item, index)
                )}
            </ScrollView>
          </Block>
        </Block>
      </Block>
    );
  };

  renderAlbum = () => {
    const { navigation } = this.props;

    return (
      <Block
        flex
        style={[styles.group, { paddingBottom: theme.SIZES.BASE * 5 }]}
      >
        <Text bold size={16} style={styles.title}>
          Album
        </Text>
        <Block style={{ marginHorizontal: theme.SIZES.BASE * 2 }}>
          <Block flex right>
            <Text
              size={12}
              color={theme.COLORS.PRIMARY}
              onPress={() => navigation.navigate("Home")}
            >
              View All
            </Text>
          </Block>
          <Block
            row
            space="between"
            style={{ marginTop: theme.SIZES.BASE, flexWrap: "wrap" }}
          >
            {Images.Viewed.map((img, index) => (
              <Block key={`viewed-${img}`} style={styles.shadow}>
                <Image
                  resizeMode="cover"
                  source={{ uri: img }}
                  style={styles.albumThumb}
                />
              </Block>
            ))}
          </Block>
        </Block>
      </Block>
    );
  };

  render() {
    return (
      <Block flex center>
        <ScrollView showsVerticalScrollIndicator={false}>
          {this.renderCards()}
          {this.renderAlbum()}
        </ScrollView>
      </Block>
    );
  }
}

const styles = StyleSheet.create({
  title: {
    paddingBottom: theme.SIZES.BASE,
    paddingHorizontal: theme.SIZES.BASE * 2,
    marginTop: 22,
    color: argonTheme.COLORS.HEADER,
  },
  group: {
    paddingTop: theme.SIZES.BASE,
  },
  albumThumb: {
    borderRadius: 4,
    marginVertical: 4,
    alignSelf: "center",
    width: thumbMeasure,
    height: thumbMeasure,
  },
  category: {
    backgroundColor: theme.COLORS.WHITE,
    marginVertical: theme.SIZES.BASE / 2,
    borderWidth: 0,
  },
  categoryTitle: {
    height: "100%",
    paddingHorizontal: theme.SIZES.BASE,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageBlock: {
    overflow: "hidden",
    borderRadius: 4,
  },
  productItem: {
    width: cardWidth - theme.SIZES.BASE * 2,
    marginHorizontal: theme.SIZES.BASE,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 7 },
    shadowRadius: 10,
    shadowOpacity: 0.2,
  },
  productImage: {
    width: cardWidth - theme.SIZES.BASE,
    height: cardWidth - theme.SIZES.BASE,
    borderRadius: 3,
  },
  productPrice: {
    paddingTop: theme.SIZES.BASE,
    paddingBottom: theme.SIZES.BASE / 2,
  },
  productDescription: {
    paddingTop: theme.SIZES.BASE,
    // paddingBottom: theme.SIZES.BASE * 2,
  },
});

export default Articles;

```

## File: screens/Elements.js

- Extension: .js
- Language: javascript
- Size: 13530 bytes
- SHA: 7a73d80e7386b2b3e211672eaf479bf232ff4d42
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```javascript
// Galio components
import { Block, Button as GaButton, Text, theme } from "galio-framework";
import { Button, Header, Icon, Input, Select, Switch } from "../components/";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
// Argon themed components
import { argonTheme, tabs } from "../constants/";

import React from "react";

const { width } = Dimensions.get("screen");

class Elements extends React.Component {
  state = {
    "switch-1": true,
    "switch-2": false,
  };

  toggleSwitch = (switchId) =>
    this.setState({ [switchId]: !this.state[switchId] });

  renderButtons = () => {
    return (
      <Block flex>
        <Text bold size={16} style={styles.title}>
          Buttons
        </Text>
        <Block style={{ paddingHorizontal: theme.SIZES.BASE }}>
          <Block center>
            <Button color="default" style={styles.button}>
              DEFAULT
            </Button>
          </Block>
          <Block center>
            <Button
              color="secondary"
              textStyle={{ color: "black", fontSize: 12, fontWeight: "700" }}
              style={styles.button}
            >
              SECONDARY
            </Button>
          </Block>
          <Block center>
            <Button style={styles.button}>PRIMARY</Button>
          </Block>
          <Block center>
            <Button color="info" style={styles.button}>
              INFO
            </Button>
          </Block>
          <Block center>
            <Button color="success" style={styles.button}>
              SUCCESS
            </Button>
          </Block>
          <Block center>
            <Button color="warning" style={styles.button}>
              WARNING
            </Button>
          </Block>
          <Block center>
            <Button color="error" style={styles.button}>
              ERROR
            </Button>
          </Block>
          <Block row space="evenly">
            <Block flex left style={{ marginTop: 8 }}>
              <Select
                defaultIndex={1}
                options={["01", "02", "03", "04", "05"]}
              />
            </Block>
            <Block flex center>
              <Button small center color="default" style={styles.optionsButton}>
                DELETE
              </Button>
            </Block>
            <Block flex={1.25} right>
              <Button center color="default" style={styles.optionsButton}>
                SAVE FOR LATER
              </Button>
            </Block>
          </Block>
        </Block>
      </Block>
    );
  };

  renderText = () => {
    return (
      <Block flex style={styles.group}>
        <Text bold size={16} style={styles.title}>
          Typography
        </Text>
        <Block style={{ paddingHorizontal: theme.SIZES.BASE }}>
          <Text
            h1
            style={{ marginBottom: theme.SIZES.BASE / 2 }}
            color={argonTheme.COLORS.DEFAULT}
          >
            Heading 1
          </Text>
          <Text
            h2
            style={{ marginBottom: theme.SIZES.BASE / 2 }}
            color={argonTheme.COLORS.DEFAULT}
          >
            Heading 2
          </Text>
          <Text
            h3
            style={{ marginBottom: theme.SIZES.BASE / 2 }}
            color={argonTheme.COLORS.DEFAULT}
          >
            Heading 3
          </Text>
          <Text
            h4
            style={{ marginBottom: theme.SIZES.BASE / 2 }}
            color={argonTheme.COLORS.DEFAULT}
          >
            Heading 4
          </Text>
          <Text
            h5
            style={{ marginBottom: theme.SIZES.BASE / 2 }}
            color={argonTheme.COLORS.DEFAULT}
          >
            Heading 5
          </Text>
          <Text
            p
            style={{ marginBottom: theme.SIZES.BASE / 2 }}
            color={argonTheme.COLORS.DEFAULT}
          >
            Paragraph
          </Text>
          <Text muted>This is a muted paragraph.</Text>
        </Block>
      </Block>
    );
  };

  renderInputs = () => {
    return (
      <Block flex style={styles.group}>
        <Text bold size={16} style={styles.title}>
          Inputs
        </Text>
        <Block style={{ paddingHorizontal: theme.SIZES.BASE }}>
          <Input right placeholder="Regular" iconContent={<Block />} />
        </Block>
        <Block style={{ paddingHorizontal: theme.SIZES.BASE }}>
          <Input
            right
            placeholder="Regular Custom"
            style={{
              borderColor: argonTheme.COLORS.INFO,
              borderRadius: 4,
              backgroundColor: "#fff",
            }}
            iconContent={<Block />}
          />
        </Block>
        <Block style={{ paddingHorizontal: theme.SIZES.BASE }}>
          <Input
            placeholder="Icon left"
            iconContent={
              <Icon
                size={11}
                style={{ marginRight: 10 }}
                color={argonTheme.COLORS.ICON}
                name="search-zoom-in"
                family="ArgonExtra"
              />
            }
          />
        </Block>
        <Block style={{ paddingHorizontal: theme.SIZES.BASE }}>
          <Input
            right
            placeholder="Icon Right"
            iconContent={
              <Icon
                size={11}
                color={argonTheme.COLORS.ICON}
                name="search-zoom-in"
                family="ArgonExtra"
              />
            }
          />
        </Block>
        <Block style={{ paddingHorizontal: theme.SIZES.BASE }}>
          <Input
            success
            right
            placeholder="Success"
            iconContent={
              <Block
                middle
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: argonTheme.COLORS.INPUT_SUCCESS,
                }}
              >
                <Icon
                  size={11}
                  color={argonTheme.COLORS.ICON}
                  name="g-check"
                  family="ArgonExtra"
                />
              </Block>
            }
          />
        </Block>
        <Block style={{ paddingHorizontal: theme.SIZES.BASE }}>
          <Input
            error
            right
            placeholder="Error Input"
            iconContent={
              <Block
                middle
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: argonTheme.COLORS.INPUT_ERROR,
                }}
              >
                <Icon
                  size={11}
                  color={argonTheme.COLORS.ICON}
                  name="support"
                  family="ArgonExtra"
                />
              </Block>
            }
          />
        </Block>
      </Block>
    );
  };

  renderSwitches = () => {
    return (
      <Block flex style={styles.group}>
        <Text bold size={16} style={styles.title}>
          Switches
        </Text>
        <Block style={{ paddingHorizontal: theme.SIZES.BASE }}>
          <Block
            row
            middle
            space="between"
            style={{ marginBottom: theme.SIZES.BASE }}
          >
            <Text size={14}>Switch is ON</Text>
            <Switch
              value={this.state["switch-1"]}
              onValueChange={() => this.toggleSwitch("switch-1")}
            />
          </Block>
          <Block row middle space="between">
            <Text size={14}>Switch is OFF</Text>
            <Switch
              value={this.state["switch-2"]}
              onValueChange={() => this.toggleSwitch("switch-2")}
            />
          </Block>
        </Block>
      </Block>
    );
  };

  renderTableCell = () => {
    const { navigation } = this.props;
    return (
      <Block flex style={styles.group}>
        <Text bold size={16} style={styles.title}>
          Table Cell
        </Text>
        <Block style={{ paddingHorizontal: theme.SIZES.BASE }}>
          <Block style={styles.rows}>
            <TouchableOpacity onPress={() => navigation.navigate("Pro")}>
              <Block row middle space="between" style={{ paddingTop: 7 }}>
                <Text size={14}>Manage Options</Text>
                <Icon
                  name="chevron-right"
                  family="entypo"
                  style={{ paddingRight: 5 }}
                />
              </Block>
            </TouchableOpacity>
          </Block>
        </Block>
      </Block>
    );
  };

  renderSocial = () => {
    return (
      <Block flex style={styles.group}>
        <Text bold size={16} style={styles.title}>
          Social
        </Text>
        <Block style={{ paddingHorizontal: theme.SIZES.BASE }}>
          <Block row center space="between">
            <Block flex middle right>
              <GaButton
                round
                onlyIcon
                shadowless
                icon="facebook"
                iconFamily="Font-Awesome"
                iconColor={theme.COLORS.WHITE}
                iconSize={theme.SIZES.BASE * 1.625}
                color={theme.COLORS.FACEBOOK}
                style={[styles.social, styles.shadow]}
              />
            </Block>
            <Block flex middle center>
              <GaButton
                round
                onlyIcon
                shadowless
                icon="twitter"
                iconFamily="Font-Awesome"
                iconColor={theme.COLORS.WHITE}
                iconSize={theme.SIZES.BASE * 1.625}
                color={theme.COLORS.TWITTER}
                style={[styles.social, styles.shadow]}
              />
            </Block>
            <Block flex middle left>
              <GaButton
                round
                onlyIcon
                shadowless
                icon="dribbble"
                iconFamily="Font-Awesome"
                iconColor={theme.COLORS.WHITE}
                iconSize={theme.SIZES.BASE * 1.625}
                color={theme.COLORS.DRIBBBLE}
                style={[styles.social, styles.shadow]}
              />
            </Block>
          </Block>
        </Block>
      </Block>
    );
  };

  renderNavigation = () => {
    return (
      <Block flex style={styles.group}>
        <Text bold size={16} style={styles.title}>
          Navigation
        </Text>
        <Block>
          <Block style={{ marginBottom: theme.SIZES.BASE }}>
            <Header back title="Title" navigation={this.props.navigation} />
          </Block>

          <Block style={{ marginBottom: theme.SIZES.BASE }}>
            <Header
              white
              back
              title="Title"
              navigation={this.props.navigation}
              bgColor={argonTheme.COLORS.ACTIVE}
              titleColor="white"
              iconColor="white"
            />
          </Block>

          <Block style={{ marginBottom: theme.SIZES.BASE }}>
            <Header search title="Title" navigation={this.props.navigation} />
          </Block>

          <Block style={{ marginBottom: theme.SIZES.BASE }}>
            <Header
              tabs={tabs.categories}
              search
              title="Title"
              navigation={this.props.navigation}
            />
          </Block>

          <Block style={{ marginBottom: theme.SIZES.BASE }}>
            <Header
              options
              search
              title="Title"
              optionLeft="Option 1"
              optionRight="Option 2"
              navigation={this.props.navigation}
            />
          </Block>
        </Block>
      </Block>
    );
  };

  render() {
    return (
      <Block flex center>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30, width }}
        >
          {this.renderButtons()}
          {this.renderText()}
          {this.renderInputs()}
          {this.renderSocial()}
          {this.renderSwitches()}
          {this.renderNavigation()}
          {this.renderTableCell()}
        </ScrollView>
      </Block>
    );
  }
}

const styles = StyleSheet.create({
  title: {
    paddingBottom: theme.SIZES.BASE,
    paddingHorizontal: theme.SIZES.BASE * 2,
    marginTop: 44,
    color: argonTheme.COLORS.HEADER,
  },
  group: {
    paddingTop: theme.SIZES.BASE * 2,
  },
  shadow: {
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowOpacity: 0.2,
    elevation: 2,
  },
  button: {
    marginBottom: theme.SIZES.BASE,
    width: width - theme.SIZES.BASE * 2,
  },
  optionsButton: {
    width: "auto",
    height: 34,
    paddingHorizontal: theme.SIZES.BASE,
    paddingVertical: 10,
  },
  input: {
    borderBottomWidth: 1,
  },
  inputDefault: {
    borderBottomColor: argonTheme.COLORS.PLACEHOLDER,
  },
  inputTheme: {
    borderBottomColor: argonTheme.COLORS.PRIMARY,
  },
  inputInfo: {
    borderBottomColor: argonTheme.COLORS.INFO,
  },
  inputSuccess: {
    borderBottomColor: argonTheme.COLORS.SUCCESS,
  },
  inputWarning: {
    borderBottomColor: argonTheme.COLORS.WARNING,
  },
  inputDanger: {
    borderBottomColor: argonTheme.COLORS.ERROR,
  },
  social: {
    width: theme.SIZES.BASE * 3.5,
    height: theme.SIZES.BASE * 3.5,
    borderRadius: theme.SIZES.BASE * 1.75,
    justifyContent: "center",
  },
});

export default Elements;

```

## File: screens/Home.js

- Extension: .js
- Language: javascript
- Size: 1170 bytes
- SHA: 36a699e042da5dbd1f2e0aa10cef4e665a3ddf29
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```javascript
import React from 'react';
import { StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Block, theme } from 'galio-framework';

import { Card } from '../components';
import articles from '../constants/articles';
const { width } = Dimensions.get('screen');

class Home extends React.Component {
  renderArticles = () => {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.articles}>
        <Block flex>
          <Card item={articles[0]} horizontal  />
          <Block flex row>
            <Card item={articles[1]} style={{ marginRight: theme.SIZES.BASE }} />
            <Card item={articles[2]} />
          </Block>
          <Card item={articles[3]} horizontal />
          <Card item={articles[4]} full />
        </Block>
      </ScrollView>
    )
  }

  render() {
    return (
      <Block flex center style={styles.home}>
        {this.renderArticles()}
      </Block>
    );
  }
}

const styles = StyleSheet.create({
  home: {
    width: width,    
  },
  articles: {
    width: width - theme.SIZES.BASE * 2,
    paddingVertical: theme.SIZES.BASE,
  },
});

export default Home;

```

## File: screens/Onboarding.js

- Extension: .js
- Language: javascript
- Size: 2500 bytes
- SHA: 983d550bf4325e9222b0c57066568def3636445e
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```javascript
import React from "react";
import {
  ImageBackground,
  Image,
  StyleSheet,
  StatusBar,
  Dimensions
} from "react-native";
import { Block, Button, Text, theme } from "galio-framework";

const { height, width } = Dimensions.get("screen");

import argonTheme from "../constants/Theme";
import Images from "../constants/Images";

class Onboarding extends React.Component {
  render() {
    const { navigation } = this.props;

    return (
      <Block flex style={styles.container}>
        <StatusBar hidden />
        <Block flex center>
        <ImageBackground
            source={Images.Onboarding}
            style={{ height, width, zIndex: 1 }}
          />
        </Block>
        <Block center>
          <Image source={Images.LogoOnboarding} style={styles.logo} />
        </Block>
        <Block flex space="between" style={styles.padded}>
            <Block flex space="around" style={{ zIndex: 2 }}>
              <Block style={styles.title}>
                <Block>
                  <Text color="white" size={60}>
                    Design
                  </Text>
                </Block>
                <Block>
                  <Text color="white" size={60}>
                    System
                  </Text>
                </Block>
                <Block style={styles.subTitle}>
                  <Text color="white" size={16}>
                    Fully coded React Native components.
                  </Text>
                </Block>
              </Block>
              <Block center>
                <Button
                  style={styles.button}
                  color={argonTheme.COLORS.SECONDARY}
                  onPress={() => navigation.navigate("App")}
                  textStyle={{ color: argonTheme.COLORS.BLACK }}
                >
                  Get Started
                </Button>
              </Block>
          </Block>
        </Block>
      </Block>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.COLORS.BLACK
  },
  padded: {
    paddingHorizontal: theme.SIZES.BASE * 2,
    position: "relative",
    bottom: theme.SIZES.BASE,
    zIndex: 2,
  },
  button: {
    width: width - theme.SIZES.BASE * 4,
    height: theme.SIZES.BASE * 3,
    shadowRadius: 0,
    shadowOpacity: 0
  },
  logo: {
    width: 200,
    height: 60,
    zIndex: 2,
    position: 'relative',
    marginTop: '-50%'
  },
  title: {
    marginTop:'-5%'
  },
  subTitle: {
    marginTop: 20
  }
});

export default Onboarding;

```

## File: screens/Pro.js

- Extension: .js
- Language: javascript
- Size: 3374 bytes
- SHA: ef914e7c5727e76e03bf22599331062ed981bfba
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```javascript
import React from 'react';
import { ImageBackground, Image, StyleSheet, StatusBar, Dimensions, Platform, Linking } from 'react-native';
import { Block, Button, Text, theme } from 'galio-framework';

const { height, width } = Dimensions.get('screen');
import { Images, argonTheme } from '../constants/';
import { HeaderHeight } from "../constants/utils";

export default class Pro extends React.Component {
  render() {
    const { navigation } = this.props;

    return (
      <Block flex style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Block flex>
          <ImageBackground
            source={Images.Pro}
            style={{ flex: 1, height: height, width, zIndex: 1 }}
          />
          <Block space="between" style={styles.padded}>
            <Block>
              <Block>
                <Image source={Images.ArgonLogo}
                  style={{ marginBottom: theme.SIZES.BASE * 1.5 }}/>
              </Block>
              <Block >
                <Block>
                  <Text color="white" size={60}>Argon</Text>
                </Block>
                <Block>
                  <Text color="white" size={60}>Design</Text>
                </Block>
                <Block row>
                  <Text color="white" size={60}>System</Text>
                  <Block middle style={styles.pro}>
                    <Text size={16} color="white">PRO</Text>
                  </Block>
                </Block>
              </Block>
              <Text size={16} color='rgba(255,255,255,0.6)' style={{ marginTop: 35 }}>
                Take advantage of all the features and screens made upon Galio Design System, coded on React Native for both.
              </Text>
              <Block row style={{ marginTop: theme.SIZES.BASE * 1.5, marginBottom: theme.SIZES.BASE * 4 }}>
                <Image
                  source={Images.iOSLogo}
                  style={{ height: 38, width: 82, marginRight: theme.SIZES.BASE * 1.5 }} />
                <Image
                  source={Images.androidLogo}
                  style={{ height: 38, width: 140 }} />
              </Block>
              <Button
                shadowless
                style={styles.button}
                color={argonTheme.COLORS.INFO}
                onPress={() => Linking.openURL('https://www.creative-tim.com/product/argon-pro-react-native').catch((err) => console.error('An error occurred', err))}>
                <Text bold color={theme.COLORS.WHITE}>BUY NOW</Text>
              </Button>
            </Block>
          </Block>
        </Block>
      </Block>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.COLORS.BLACK,
    marginTop: Platform.OS === 'android' ? -HeaderHeight : 0,
  },
  padded: {
    paddingHorizontal: theme.SIZES.BASE * 2,
    zIndex: 3,
    position: 'absolute',
    bottom: Platform.OS === 'android' ? theme.SIZES.BASE * 2 : theme.SIZES.BASE * 3,
  },
  button: {
    width: width - theme.SIZES.BASE * 4,
    height: theme.SIZES.BASE * 3,
    shadowRadius: 0,
    shadowOpacity: 0,
  },
  pro: {
    backgroundColor: argonTheme.COLORS.INFO,
    paddingHorizontal: 8,
    marginLeft: 3,
    borderRadius: 4,
    height: 22,
    marginTop: 15
  },
  gradient: {
    zIndex: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 66,
  },
});

```

## File: screens/Profile.js

- Extension: .js
- Language: javascript
- Size: 10863 bytes
- SHA: e70150fa13a7e4b7990541adb3c826fc8ea22768
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```javascript
import React from "react";
import {
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
  ImageBackground,
  Platform
} from "react-native";
import { Block, Text, theme } from "galio-framework";

import { Button } from "../components";
import { Images, argonTheme } from "../constants";
import { HeaderHeight } from "../constants/utils";

const { width, height } = Dimensions.get("screen");

const thumbMeasure = (width - 48 - 32) / 3;

class Profile extends React.Component {
  render() {
    return (
      <Block flex style={styles.profile}>
        <Block flex>
          <ImageBackground
            source={Images.ProfileBackground}
            style={styles.profileContainer}
            imageStyle={styles.profileBackground}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ width, marginTop: '25%' }}
            >
              <Block flex style={styles.profileCard}>
                <Block middle style={styles.avatarContainer}>
                  <Image
                    source={{ uri: Images.ProfilePicture }}
                    style={styles.avatar}
                  />
                </Block>
                <Block style={styles.info}>
                  <Block
                    middle
                    row
                    space="evenly"
                    style={{ marginTop: 20, paddingBottom: 24 }}
                  >
                    <Button
                      small
                      style={{ backgroundColor: argonTheme.COLORS.INFO }}
                    >
                      CONNECT
                    </Button>
                    <Button
                      small
                      style={{ backgroundColor: argonTheme.COLORS.DEFAULT }}
                    >
                      MESSAGE
                    </Button>
                  </Block>
                  <Block row space="between">
                    <Block middle>
                      <Text
                        bold
                        size={18}
                        color="#525F7F"
                        style={{ marginBottom: 4 }}
                      >
                        2K
                      </Text>
                      <Text size={12} color={argonTheme.COLORS.TEXT}>Orders</Text>
                    </Block>
                    <Block middle>
                      <Text
                        bold
                        color="#525F7F"
                        size={18}
                        style={{ marginBottom: 4 }}
                      >
                        10
                      </Text>
                      <Text size={12} color={argonTheme.COLORS.TEXT}>Photos</Text>
                    </Block>
                    <Block middle>
                      <Text
                        bold
                        color="#525F7F"
                        size={18}
                        style={{ marginBottom: 4 }}
                      >
                        89
                      </Text>
                      <Text size={12} color={argonTheme.COLORS.TEXT}>Comments</Text>
                    </Block>
                  </Block>
                </Block>
                <Block flex>
                  <Block middle style={styles.nameInfo}>
                    <Text bold size={28} color="#32325D">
                      Jessica Jones, 27
                    </Text>
                    <Text size={16} color="#32325D" style={{ marginTop: 10 }}>
                      San Francisco, USA
                    </Text>
                  </Block>
                  <Block middle style={{ marginTop: 30, marginBottom: 16 }}>
                    <Block style={styles.divider} />
                  </Block>
                  <Block middle>
                    <Text
                      size={16}
                      color="#525F7F"
                      style={{ textAlign: "center" }}
                    >
                      An artist of considerable range, Jessica name taken by
                      Melbourne …
                    </Text>
                    <Button
                      color="transparent"
                      textStyle={{
                        color: "#233DD2",
                        fontWeight: "500",
                        fontSize: 16
                      }}
                    >
                      Show more
                    </Button>
                  </Block>
                  <Block
                    row
                    space="between"
                  >
                    <Text bold size={16} color="#525F7F" style={{marginTop: 12}}>
                      Album
                    </Text>
                    <Button
                      small
                      color="transparent"
                      textStyle={{ color: "#5E72E4", fontSize: 12, marginLeft: 24 }}
                    >
                      View all
                    </Button>
                  </Block>
                  <Block style={{ paddingBottom: -HeaderHeight * 2 }}>
                    <Block row space="between" style={{ flexWrap: "wrap" }}>
                      {Images.Viewed.map((img, imgIndex) => (
                        <Image
                          source={{ uri: img }}
                          key={`viewed-${img}`}
                          resizeMode="cover"
                          style={styles.thumb}
                        />
                      ))}
                    </Block>
                  </Block>
                </Block>
              </Block>
            </ScrollView>
          </ImageBackground>
        </Block>
        {/* <ScrollView showsVerticalScrollIndicator={false} 
                    contentContainerStyle={{ flex: 1, width, height, zIndex: 9000, backgroundColor: 'red' }}>
        <Block flex style={styles.profileCard}>
          <Block middle style={styles.avatarContainer}>
            <Image
              source={{ uri: Images.ProfilePicture }}
              style={styles.avatar}
            />
          </Block>
          <Block style={styles.info}>
            <Block
              middle
              row
              space="evenly"
              style={{ marginTop: 20, paddingBottom: 24 }}
            >
              <Button small style={{ backgroundColor: argonTheme.COLORS.INFO }}>
                CONNECT
              </Button>
              <Button
                small
                style={{ backgroundColor: argonTheme.COLORS.DEFAULT }}
              >
                MESSAGE
              </Button>
            </Block>

            <Block row space="between">
              <Block middle>
                <Text
                  bold
                  size={12}
                  color="#525F7F"
                  style={{ marginBottom: 4 }}
                >
                  2K
                </Text>
                <Text size={12}>Orders</Text>
              </Block>
              <Block middle>
                <Text bold size={12} style={{ marginBottom: 4 }}>
                  10
                </Text>
                <Text size={12}>Photos</Text>
              </Block>
              <Block middle>
                <Text bold size={12} style={{ marginBottom: 4 }}>
                  89
                </Text>
                <Text size={12}>Comments</Text>
              </Block>
            </Block>
          </Block>
          <Block flex>
              <Block middle style={styles.nameInfo}>
                <Text bold size={28} color="#32325D">
                  Jessica Jones, 27
                </Text>
                <Text size={16} color="#32325D" style={{ marginTop: 10 }}>
                  San Francisco, USA
                </Text>
              </Block>
              <Block middle style={{ marginTop: 30, marginBottom: 16 }}>
                <Block style={styles.divider} />
              </Block>
              <Block middle>
                <Text size={16} color="#525F7F" style={{ textAlign: "center" }}>
                  An artist of considerable range, Jessica name taken by
                  Melbourne …
                </Text>
                <Button
                  color="transparent"
                  textStyle={{
                    color: "#233DD2",
                    fontWeight: "500",
                    fontSize: 16
                  }}
                >
                  Show more
                </Button>
              </Block>
              <Block
                row
                style={{ paddingVertical: 14, alignItems: "baseline" }}
              >
                <Text bold size={16} color="#525F7F">
                  Album
                </Text>
              </Block>
              <Block
                row
                style={{ paddingBottom: 20, justifyContent: "flex-end" }}
              >
                <Button
                  small
                  color="transparent"
                  textStyle={{ color: "#5E72E4", fontSize: 12 }}
                >
                  View all
                </Button>
              </Block>
              <Block style={{ paddingBottom: -HeaderHeight * 2 }}>
                <Block row space="between" style={{ flexWrap: "wrap" }}>
                  {Images.Viewed.map((img, imgIndex) => (
                    <Image
                      source={{ uri: img }}
                      key={`viewed-${img}`}
                      resizeMode="cover"
                      style={styles.thumb}
                    />
                  ))}
                </Block>
              </Block>
          </Block>
        </Block>
                  </ScrollView>*/}
      </Block>
    );
  }
}

const styles = StyleSheet.create({
  profile: {
    marginTop: Platform.OS === "android" ? -HeaderHeight : 0,
    // marginBottom: -HeaderHeight * 2,
    flex: 1
  },
  profileContainer: {
    width: width,
    height: height,
    padding: 0,
    zIndex: 1
  },
  profileBackground: {
    width: width,
    height: height / 2
  },
  profileCard: {
    // position: "relative",
    padding: theme.SIZES.BASE,
    marginHorizontal: theme.SIZES.BASE,
    marginTop: 65,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: theme.COLORS.WHITE,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    shadowOpacity: 0.2,
    zIndex: 2
  },
  info: {
    paddingHorizontal: 40
  },
  avatarContainer: {
    position: "relative",
    marginTop: -80
  },
  avatar: {
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 0
  },
  nameInfo: {
    marginTop: 35
  },
  divider: {
    width: "90%",
    borderWidth: 1,
    borderColor: "#E9ECEF"
  },
  thumb: {
    borderRadius: 4,
    marginVertical: 4,
    alignSelf: "center",
    width: thumbMeasure,
    height: thumbMeasure
  }
});

export default Profile;

```

## File: screens/Register.js

- Extension: .js
- Language: javascript
- Size: 7006 bytes
- SHA: c6e8f7ed9684b887e9cc00589064a17027975191
- Created: 2024-11-22
- Modified: 2024-11-22

### Code

```javascript
import React from "react";
import {
  StyleSheet,
  ImageBackground,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView
} from "react-native";
import { Block, Checkbox, Text, theme } from "galio-framework";

import { Button, Icon, Input } from "../components";
import { Images, argonTheme } from "../constants";

const { width, height } = Dimensions.get("screen");

class Register extends React.Component {
  render() {
    return (
      <Block flex middle>
        <StatusBar hidden />
        <ImageBackground
          source={Images.RegisterBackground}
          style={{ width, height, zIndex: 1 }}
        >
          <Block safe flex middle>
            <Block style={styles.registerContainer}>
              <Block flex={0.25} middle style={styles.socialConnect}>
                <Text color="#8898AA" size={12}>
                  Sign up with
                </Text>
                <Block row style={{ marginTop: theme.SIZES.BASE }}>
                  <Button style={{ ...styles.socialButtons, marginRight: 30 }}>
                    <Block row>
                      <Icon
                        name="logo-github"
                        family="Ionicon"
                        size={14}
                        color={"black"}
                        style={{ marginTop: 2, marginRight: 5 }}
                      />
                      <Text style={styles.socialTextButtons}>GITHUB</Text>
                    </Block>
                  </Button>
                  <Button style={styles.socialButtons}>
                    <Block row>
                      <Icon
                        name="logo-google"
                        family="Ionicon"
                        size={14}
                        color={"black"}
                        style={{ marginTop: 2, marginRight: 5 }}
                      />
                      <Text style={styles.socialTextButtons}>GOOGLE</Text>
                    </Block>
                  </Button>
                </Block>
              </Block>
              <Block flex>
                <Block flex={0.17} middle>
                  <Text color="#8898AA" size={12}>
                    Or sign up the classic way
                  </Text>
                </Block>
                <Block flex center>
                  <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior="padding"
                    enabled
                  >
                    <Block width={width * 0.8} style={{ marginBottom: 15 }}>
                      <Input
                        borderless
                        placeholder="Name"
                        iconContent={
                          <Icon
                            size={16}
                            color={argonTheme.COLORS.ICON}
                            name="hat-3"
                            family="ArgonExtra"
                            style={styles.inputIcons}
                          />
                        }
                      />
                    </Block>
                    <Block width={width * 0.8} style={{ marginBottom: 15 }}>
                      <Input
                        borderless
                        placeholder="Email"
                        iconContent={
                          <Icon
                            size={16}
                            color={argonTheme.COLORS.ICON}
                            name="ic_mail_24px"
                            family="ArgonExtra"
                            style={styles.inputIcons}
                          />
                        }
                      />
                    </Block>
                    <Block width={width * 0.8}>
                      <Input
                        password
                        borderless
                        placeholder="Password"
                        iconContent={
                          <Icon
                            size={16}
                            color={argonTheme.COLORS.ICON}
                            name="padlock-unlocked"
                            family="ArgonExtra"
                            style={styles.inputIcons}
                          />
                        }
                      />
                      <Block row style={styles.passwordCheck}>
                        <Text size={12} color={argonTheme.COLORS.MUTED}>
                          password strength:
                        </Text>
                        <Text bold size={12} color={argonTheme.COLORS.SUCCESS}>
                          {" "}
                          strong
                        </Text>
                      </Block>
                    </Block>
                    <Block row width={width * 0.75}>
                      <Checkbox
                        checkboxStyle={{
                          borderWidth: 3
                        }}
                        color={argonTheme.COLORS.PRIMARY}
                        label="I agree with the"
                      />
                      <Button
                        style={{ width: 100 }}
                        color="transparent"
                        textStyle={{
                          color: argonTheme.COLORS.PRIMARY,
                          fontSize: 14
                        }}
                      >
                        Privacy Policy
                      </Button>
                    </Block>
                    <Block middle>
                      <Button color="primary" style={styles.createButton}>
                        <Text bold size={14} color={argonTheme.COLORS.WHITE}>
                          CREATE ACCOUNT
                        </Text>
                      </Button>
                    </Block>
                  </KeyboardAvoidingView>
                </Block>
              </Block>
            </Block>
          </Block>
        </ImageBackground>
      </Block>
    );
  }
}

const styles = StyleSheet.create({
  registerContainer: {
    width: width * 0.9,
    height: height * 0.875,
    backgroundColor: "#F4F5F7",
    borderRadius: 4,
    shadowColor: argonTheme.COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowRadius: 8,
    shadowOpacity: 0.1,
    elevation: 1,
    overflow: "hidden"
  },
  socialConnect: {
    backgroundColor: argonTheme.COLORS.WHITE,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#8898AA"
  },
  socialButtons: {
    width: 120,
    height: 40,
    backgroundColor: "#fff",
    shadowColor: argonTheme.COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowRadius: 8,
    shadowOpacity: 0.1,
    elevation: 1
  },
  socialTextButtons: {
    color: argonTheme.COLORS.PRIMARY,
    fontWeight: "800",
    fontSize: 14
  },
  inputIcons: {
    marginRight: 12
  },
  passwordCheck: {
    paddingLeft: 15,
    paddingTop: 13,
    paddingBottom: 30
  },
  createButton: {
    width: width * 0.5,
    marginTop: 25
  }
});

export default Register;

```
