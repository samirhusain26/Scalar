### **1. Account System & Cloud Storage (Supabase)**

* **Backend Setup**
* [ ] Initialize Supabase project (Auth + Database).
* [ ] Create `profiles` table (id, email, username, avatar_url).
* [ ] Create `game_stats` table (user_id, total_games, wins, current_streak, max_streak).
* [ ] Create `game_history` table (user_id, game_data_blob, timestamp).


* **Frontend Authentication**
* [ ] Install `@supabase/supabase-js`.
* [ ] Create `useAuth` hook for session management.
* [ ] Build `LoginModal` component (Email/Password or OAuth).
* [ ] Update Header to show "Login" button or User Avatar.


* **Data Synchronization**
* [ ] Create logic to merge `localStorage` stats with Supabase data upon login (conflict resolution: keep highest values).
* [ ] Update `gameStore.ts` middleware to sync state changes to Supabase when a user is logged in.



### **2. Difficulty Modes**

* **State Management**
* [ ] Add `difficulty` field to `GameState` ('NOVICE' | 'SCHOLAR' | 'GRANDMASTER').
* [ ] Add `difficulty` selector to a new Settings menu.


* **Game Logic Adjustments (`gameLogic.ts`)**
* [ ] **Novice Mode:**
* [ ] Increase `HOT` distance threshold (e.g., < 2000km).
* [ ] Increase `HOT` percentage threshold (e.g., wider numeric range).
* [ ] Start game with 1 random attribute already revealed.
* [ ] Increase starting Hint Credits to 5.


* **Scholar Mode (Default):**
* [ ] Keep existing thresholds and 3 Hint Credits.


* **Grandmaster Mode:**
* [ ] Decrease starting Hint Credits to 0.
* [ ] Implement "Strict Mode" validation: Prevent submitting guesses that contradict previous "EXACT" feedback.
* [ ] Apply a move count penalty multiplier (e.g., hints cost 5 moves).





### **3. Engagement & Fun Features**

* **Daily Scalar Mode**
* [ ] Implement a seeded random number generator (using today's date string as the seed) to ensure all users get the same target.
* [ ] Add a "Daily" vs. "Unlimited" toggle in the main menu.
* [ ] Add a countdown timer to the next daily reset.
* [ ] Create a separate stats track for Daily Streak.


* **The Archive ("Pokedex")**
* [ ] Create a `Collection` view in the main navigation.
* [ ] Design `EntityCard` for the collection (shows full "Bio" with all attributes revealed).
* [ ] Add logic to unlock entities in the Collection upon a "SOLVED" game status.
* [ ] Add progress bars per category (e.g., "Countries: 15/196 Collected").


* **Visual Polish ("Juice")**
* [ ] **Receipt Printer Animation:** Create a CSS animation for the `GameOverModal` so results slide out like a thermal receipt.
* [ ] **Map Visualization (Countries):** Integrate `react-simple-maps` to highlight guessed countries on a world map during gameplay.
* [ ] **Confetti/Particles:** Add a subtle thermal-colored particle explosion on "SOLVED" status.



### **4. UI/UX Improvements**

* **Settings Modal**
* [ ] Create a dedicated Settings dialog.
* [ ] Move "Dark/Light Mode" (if applicable) and "Difficulty" here.
* [ ] Add "Reset Local Data" danger button.


* **Statistics Dashboard**
* [ ] Create a `StatsModal` to visualize performance.
* [ ] Implement a Bar Chart for "Guess Distribution" (e.g., how many games won in 3 moves vs. 4 moves).
* [ ] Display Win % and Current/Max Streaks.