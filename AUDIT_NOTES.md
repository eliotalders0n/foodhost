# Foodhost Audit Notes

## Inferred Product Goal

This codebase is trying to be a mobile-first local food marketplace built with Expo and Firebase.

Core intended flow:

- Sellers sign up with phone OTP and create a profile.
- Sellers list meals/products with a photo, price, quantity, and current location.
- Buyers browse nearby food, open seller profiles, and inspect individual listings.
- Buyers send an inquiry/offer for a quantity of plates.
- Sellers review incoming inquiries and accept or reject them.
- The app optionally supports push notifications and later payment integration.

The product language has drifted during development. Some screens still refer to `produce`, `farmers`, and `catalogue`, while others refer to `food`, `meals`, and `plates`. The current implementation is closer to "local meal sellers and buyers" than a general restaurant or grocery app.

## Current Architecture

- Runtime: Expo SDK 42, React Navigation 5, Firebase v8.
- Backend: Firestore, Firebase Auth, Firebase Storage.
- Main collections in Firestore:
  - `users`
  - `products`
  - `categories`
  - `inquires`
  - `amenities`
  - `feedback`

Primary screens:

- Auth: `Welcome`, `Signup`, `Signin`
- Browse: `Search`, `Explore`, `ViewProduce`, `UserProfile`
- Seller: `Profile`, `AddProduct`, `ManageProducts`, `ViewProduct`, `EditProduct`
- Requests: `Inquiry`, `Inquiries`
- Misc: `Feedback`, `StoreDetails`, `AddAmenities`, `ManageStore`

## Highest-Risk Findings

1. Listing visibility is tied to a stringified local date, which makes "listed/unlisted" status expire daily and makes discovery dependent on the device date.
   - `products` are fetched for the home feed only when `createdAt === new Date(...).toString().slice(0, 15)` in `comp/crud/useGetProductsToday.js`.
   - Sellers are marked "listed" or "unlisted" with the same date comparison in `comp/profile/ManageProducts.js`.
   - This is a brittle surrogate for a real availability flag and will create inconsistent behavior across timezones and days.

2. The inquiry acceptance flow can oversell stock because inventory is decremented only on acceptance, with no stock guard, transaction, or duplicate acceptance protection.
   - `updateStatus` decrements `products.items` after updating the inquiry status in `comp/profile/Inquiries.js`.
   - Multiple pending requests can all be accepted against the same inventory.

3. `ViewProduce` updates a product view count before the async product document is guaranteed to exist in component state.
   - The effect writes to `doc(item.id)` on mount in `comp/explore/ViewProduce.js`.
   - `item` comes from `useGetProduct`, which initializes as an empty array-like state and resolves later.
   - This can attempt writes against an undefined document id.

4. Search results are effectively disabled in the UI even though the search hook exists.
   - `useSearch` is wired in `comp/search/Search.js`, but the search-results rendering block is commented out and the screen always renders today's products.
   - The search button also reads `searchBOx.current.value`, which is not the normal React Native `TextInput` pattern.

5. The store/amenities feature is not user-scoped and currently targets a hard-coded document.
   - `useGetStore` reads a fixed amenities doc id in `comp/crud/useGetStore.js`.
   - `StoreDetails` updates the same fixed doc id in `comp/profile/StoreDetails.js`.
   - `ManageStore` expects `route.params.user`, but the current navigation setup does not show an active route into it.

6. Payment integration is unfinished and partly incompatible with the app runtime.
   - The active inquiry flow bypasses payment entirely in `comp/orders/Inquiry.js`.
   - `comp/profile/Flutterwave.js` is an unused React DOM-style test component with `<div>` and `<button>`, which does not belong in a React Native app.

7. Sensitive service keys are committed in source.
   - Firebase config is hard-coded in `firebase.js`.
   - A Google API key is hard-coded in `constants/maps.js`.

## Product/UX Notes

- The app has a coherent seller flow: add listing, manage listing, repost listing, review inquiries.
- The buyer flow is present but incomplete: discover listings, inspect listing, submit inquiry, see sent requests.
- Notifications were partially implemented:
  - seller push token registration happens in `Inquiry`
  - home-screen notification registration was started and commented out in `Search`
- There is evidence of a pivot:
  - `produce`, `farmer`, and `items` terminology suggest an older fresh-produce marketplace
  - `meal`, `plate`, and "Find food in your area" suggest a later home-food marketplace
- The store amenities feature looks inherited from a lodging/hospitality product rather than this food app:
  - references to towels, toilet paper, private entrance, cancellation window, and "house rules"

## Data Model Notes

`users` appears to contain:

- `username`
- `name`
- `gender`
- `district`
- `province`
- `type`
- `phone`
- sometimes `expoPushToken`

`products` appears to contain:

- `produce_category`
- `produce`
- `createdAt`
- `price`
- `items`
- `latitude`
- `longitude`
- `delivery`
- `images`
- optional `gallery`
- `u_id`
- optional `views`

`inquires` appears to contain:

- `buyer`
- `seller`
- `ProductID`
- `produce`
- `price`
- `quant`
- `totalPrice`
- `instruction`
- `status`
- `createdAt`

## Code Quality Notes

- There are many unused imports and variables across the app.
- Several hooks subscribe with `onSnapshot` but never return unsubscribe handlers.
- Naming is inconsistent:
  - `useGetFamers` typo
  - `inquires` instead of `inquiries`
  - `updateProfile` component is lowercased
- Some state is dead or vestigial:
  - amenities state inside `Signup`
  - `status` and notification state in `Search`
  - multiple commented sections for old flows
- The app mixes product terminology heavily enough that future maintenance will stay confusing until the domain model is renamed consistently.

## What The Team Was Likely Trying To Achieve

Most likely target outcome:

- A Zambia-focused mobile app where people can sell prepared food from their location.
- Buyers browse nearby meals, contact sellers, and possibly pay through mobile money.
- Sellers manage a daily rotating menu or stock.
- Push notifications alert sellers when a buyer sends a request.

The current code proves that vision more than the README does. The main blockers are not lack of features; they are unfinished integration, stale architecture, and drift from previous product concepts.

## Recommended Next Cleanup Order

1. Decide the domain language and rename the app model consistently: `meal` vs `product` vs `produce`.
2. Replace `createdAt` date-string listing logic with explicit fields such as `isActive`, `availableOn`, and `updatedAt`.
3. Fix discovery/search so the home feed and search results are intentional and testable.
4. Put inquiry acceptance and stock decrement into a Firestore transaction.
5. Remove or rebuild the store/amenities feature so it matches the food product.
6. Remove the dead Flutterwave prototype and reintroduce payments only with a real React Native flow.
7. Move keys/config to environment-managed configuration.
