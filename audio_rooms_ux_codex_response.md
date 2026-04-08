# Audio Rooms UX/Implementation Blueprint (React Native + TypeScript)

## 1) UX strategy summary (max 12 bullets)
- Prioritize a **Discover → Join in 1 tap** path with clear room metadata (title, hosts, counts, language/topic).
- Make role state explicit at all times with badges and context-aware bottom action bar.
- Default entry mode is **listener** for safety and lower cognitive load.
- Keep room participation actions fast with optimistic UI (counts update immediately, rollback on failure).
- Surface network health continuously (connection pill + reconnect banner).
- Use progressive disclosure: listeners see minimal controls; hosts/mods see advanced moderation controls.
- Ensure accessibility first: 44x44 touch targets, screen-reader labels, scalable type, high-contrast dark mode.
- Use lightweight micro-transitions (150–250ms) only for state transitions (role changes, sheet open/close).
- Provide resilient states for loading/empty/error with retry and pull-to-refresh patterns.
- Standardize feedback via non-blocking toast/snackbar for join/leave/errors/rate limits.
- Keep ephemeral room state local to room domain; global auth stays in auth store.
- Add production guardrails: re-auth flow for 401/403, field-level errors for 400, cooldown UX for 429.

---

## 2) Screen-by-screen wireframe description

### A) Live Rooms Discovery Screen
**Layout**
- Top app bar: `Audio Rooms` title + create room FAB/button.
- Horizontal filter chips: `Language`, `Topic`, `Status (Live/All)`.
- Main list: paginated room cards.

**Room Card**
- Row 1: Room title (2 lines max) + LIVE badge.
- Row 2: host avatars stack + host names snippet.
- Row 3: speaker/listener counters + language tag + topic tag.
- CTA: whole card tappable to join/enter.

**States**
- Loading: skeleton cards (3–6 placeholders).
- Empty: illustration + “No live rooms right now” + “Create room”.
- Error: inline error card + Retry CTA.
- Pull-to-refresh and infinite scroll spinner/footer.

---

### B) Create Room Flow
**Entry**
- Modal/bottom sheet from discovery screen.

**Form fields**
- `Title` (required), `Description` (optional), `Topic` (optional select/text).

**Validation UX**
- Inline field errors under each invalid input.
- Disable submit until title is valid.
- 400 errors map to corresponding fields.

**Success path**
- On success: close modal → navigate to Room Screen as host.
- Show toast: “Room created successfully”.

---

### C) Room Screen (Core Experience)
**Header**
- Back/leave affordance, room title, live status, participants count, share icon.
- Connection quality indicator (`Good / Fair / Poor`).

**Body sections**
1. Host/Moderators strip (horizontal avatars + role badges).
2. Speakers grid (2-column responsive cards).
3. Listeners list (virtualized list with lightweight cells).

**Sticky bottom action bar**
- Listener:
  - `Leave Quietly`
  - `Raise Hand` (placeholder action + tooltip)
  - `Share Room`
- Speaker/Moderator/Host:
  - `Mute/Unmute`
  - `Leave`
  - `Invite`

**Realtime UX**
- Participant counts animate subtly on updates.
- Role transition banner (e.g., “You are now a Speaker”).
- Reconnection banner when transport drops.

---

### D) Role-aware UI states
- **Listener view**: mic action disabled + tooltip (“Mic is managed by moderators”).
- **Speaker view**: primary mic control enabled, hand raise hidden.
- **Moderator/Host view**: moderation shortcuts (invite, speaker management entry points).
- Transition states use 150–250ms opacity/translate animation and never block taps.

---

## 3) Exact React Native file tree

```text
src/
  screens/
    audioRooms/
      LiveRoomsScreen.tsx
      CreateRoomScreen.tsx
      RoomScreen.tsx
      components/
        RoomListHeader.tsx
  components/
    audioRooms/
      RoomCard.tsx
      RoomCardSkeleton.tsx
      FilterChips.tsx
      EmptyState.tsx
      ErrorState.tsx
      ParticipantAvatar.tsx
      RoleBadge.tsx
      HostModeratorsStrip.tsx
      SpeakersGrid.tsx
      ListenersList.tsx
      RoomActionBar.tsx
      ConnectionBanner.tsx
      ConnectionQualityPill.tsx
      CreateRoomForm.tsx
      FieldErrorText.tsx
      ReauthPromptSheet.tsx
  hooks/
    audioRooms/
      useLiveRooms.ts
      useCreateRoom.ts
      useJoinRoom.ts
      useLeaveRoom.ts
      useRoomToken.ts
      useRoomRealtimeState.ts
      useOptimisticParticipantCounts.ts
  services/
    audioRooms.api.ts
  types/
    audioRooms.ts
  design/
    tokens/
      colors.ts
      typography.ts
      spacing.ts
      roleBadges.ts
  navigation/
    audioRooms.navigator.tsx
```

---

## 4) Code snippets for key components/hooks

### `types/audioRooms.ts`
```ts
export type RoomRole = 'listener' | 'speaker' | 'moderator' | 'host';

export interface AudioRoomSummary {
  id: string;
  title: string;
  description?: string;
  topic?: string;
  language?: string;
  hostAvatars: string[];
  speakerCount: number;
  listenerCount: number;
  status: 'live' | 'scheduled' | 'ended';
}

export interface AudioRoomParticipant {
  id: string;
  name: string;
  avatarUrl?: string;
  role: RoomRole;
  isMuted?: boolean;
}

export interface RoomTokenResponse {
  token: string;
  role: RoomRole;
  canPublish: boolean;
}
```

### `hooks/audioRooms/useLiveRooms.ts`
```ts
import {useInfiniteQuery} from '@tanstack/react-query';
import {audioRoomsApi} from '../../services/audioRooms.api';

export const useLiveRooms = (filters: {language?: string; topic?: string; status?: string}) => {
  return useInfiniteQuery({
    queryKey: ['liveRooms', filters],
    queryFn: ({pageParam = 1}) => audioRoomsApi.getLiveRooms({...filters, page: pageParam}),
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    staleTime: 15_000,
  });
};
```

### `hooks/audioRooms/useJoinRoom.ts`
```ts
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {audioRoomsApi} from '../../services/audioRooms.api';

export const useJoinRoom = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (roomId: string) => audioRoomsApi.joinRoom(roomId),
    onMutate: async (roomId) => {
      await qc.cancelQueries({queryKey: ['liveRooms']});
      const prev = qc.getQueriesData({queryKey: ['liveRooms']});
      // optimistic count +1 listeners
      qc.setQueriesData({queryKey: ['liveRooms']}, (data: any) => {
        if (!data) return data;
        return {
          ...data,
          pages: data.pages.map((p: any) => ({
            ...p,
            items: p.items.map((r: any) =>
              r.id === roomId ? {...r, listenerCount: r.listenerCount + 1} : r,
            ),
          })),
        };
      });
      return {prev};
    },
    onError: (_err, _roomId, ctx) => {
      // rollback
      ctx?.prev?.forEach(([key, value]: any) => qc.setQueryData(key, value));
    },
    onSettled: () => qc.invalidateQueries({queryKey: ['liveRooms']}),
  });
};
```

### `components/audioRooms/RoomActionBar.tsx`
```tsx
import React from 'react';
import {View} from 'react-native';
import {RoomRole} from '../../types/audioRooms';
import {ActionButton} from './shared/ActionButton';

export const RoomActionBar = ({
  role,
  isMuted,
  onLeave,
  onRaiseHand,
  onShare,
  onToggleMute,
  onInvite,
}: {
  role: RoomRole;
  isMuted: boolean;
  onLeave: () => void;
  onRaiseHand: () => void;
  onShare: () => void;
  onToggleMute: () => void;
  onInvite: () => void;
}) => {
  const isListener = role === 'listener';

  return (
    <View style={{padding: 12, flexDirection: 'row', gap: 8}} accessible accessibilityRole="toolbar">
      {isListener ? (
        <>
          <ActionButton label="Leave Quietly" tone="danger" onPress={onLeave} minSize={44} />
          <ActionButton label="Raise Hand" tone="accent" onPress={onRaiseHand} minSize={44} />
          <ActionButton label="Share Room" tone="neutral" onPress={onShare} minSize={44} />
        </>
      ) : (
        <>
          <ActionButton label={isMuted ? 'Unmute' : 'Mute'} tone="accent" onPress={onToggleMute} minSize={44} />
          <ActionButton label="Leave" tone="danger" onPress={onLeave} minSize={44} />
          <ActionButton label="Invite" tone="neutral" onPress={onInvite} minSize={44} />
        </>
      )}
    </View>
  );
};
```

### `design/tokens/roleBadges.ts`
```ts
export const roleBadgeStyles = {
  host: {bg: '#7C5CFC', fg: '#FFFFFF', label: 'HOST'},
  moderator: {bg: '#2F80ED', fg: '#FFFFFF', label: 'MOD'},
  speaker: {bg: '#27AE60', fg: '#FFFFFF', label: 'SPEAKER'},
  listener: {bg: '#4F4F4F', fg: '#FFFFFF', label: 'LISTENER'},
} as const;
```

---

## 5) API integration examples

### `services/audioRooms.api.ts`
```ts
import {apiClient} from '../core/apiClient';

export const audioRoomsApi = {
  getLiveRooms: async (params?: Record<string, any>) => {
    const {data} = await apiClient.get('/api/v1/audio-rooms/live', {params});
    return data;
  },

  createRoom: async (payload: {title: string; description?: string; topic?: string}) => {
    const {data} = await apiClient.post('/api/v1/audio-rooms', payload);
    return data;
  },

  joinRoom: async (roomId: string) => {
    const {data} = await apiClient.post(`/api/v1/audio-rooms/${roomId}/join`);
    return data;
  },

  leaveRoom: async (roomId: string) => {
    const {data} = await apiClient.post(`/api/v1/audio-rooms/${roomId}/leave`);
    return data;
  },

  getRoomToken: async (roomId: string) => {
    const {data} = await apiClient.post(`/api/v1/audio-rooms/${roomId}/token`);
    return data;
  },

  getLegacyLiveKitToken: async (payload: {roomId: string; role?: string}) => {
    const {data} = await apiClient.post('/api/v1/livekit/token', payload);
    return data;
  },
};
```

### Error mapping contract (401/403/400/429)
```ts
export const mapApiError = (error: any) => {
  const status = error?.response?.status;
  const payload = error?.response?.data;

  if (status === 401 || status === 403) {
    return {type: 'auth', message: 'Session expired. Please sign in again.'};
  }

  if (status === 400) {
    return {
      type: 'validation',
      message: 'Please fix highlighted fields.',
      fieldErrors: payload?.errors ?? {},
    };
  }

  if (status === 429) {
    return {
      type: 'ratelimit',
      message: payload?.message ?? 'Too many requests. Please wait and try again.',
      retryAfter: payload?.retryAfter,
    };
  }

  return {type: 'generic', message: 'Something went wrong. Please retry.'};
};
```

---

## 6) QA/UAT checklist and performance budget

### QA/UAT checklist
- Discovery list loads with skeleton, error retry, and empty state CTA.
- Filters update query and list content correctly.
- Pull-to-refresh refreshes first page; infinite scroll loads next page.
- Create room validates required title and displays field-level backend errors.
- Create success routes directly to room as host.
- Listener joins room with mic locked UI + explanatory hint.
- Role transition listener→speaker updates controls without screen reload.
- Leave room decrements participant count with rollback if request fails.
- 401/403 forces re-auth sheet and safe navigation fallback.
- 429 shows cooldown message and disables repeated action briefly.
- Screen-reader announces buttons/roles/count changes.
- Dark mode + light mode visual parity confirmed.

### Edge cases checklist
- Duplicate join taps (debounce + disabled button while pending).
- Room ends while user is inside (graceful end-room notice).
- Token issuance fails for one endpoint, fallback to legacy endpoint.
- Network drop during active room (reconnection banner + retry).
- Stale room card data after join/leave (query invalidation consistency).

### Performance budget
- Discovery initial render: < 1.2s on mid-tier device (cached), < 2.5s cold network.
- Room screen interaction latency: < 100ms for tap feedback.
- Realtime participant diff application: < 50ms per update batch.
- Max JS frame drops during scroll: < 5% frames below 55fps.
- Bundle impact for audio rooms module: target < 200KB gzipped net-new JS.
