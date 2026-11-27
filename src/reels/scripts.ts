// Five reel scripts for the trip board: one line on screen per cut, a shot to put under each,
// and the end card. "needs" names any board feature a script leans on that isn't built yet.

export type ScriptLine = { text: string; shot: string };
export type ReelScript = {
  id: string;
  name: string;
  idea: string;
  lines: ScriptLine[];
  tagline: string;
  needs?: string;
};

export const SCRIPTS: ReelScript[] = [
  {
    id: 'numbers',
    name: 'The numbers',
    idea: 'A countdown of the chaos, then the one link that fixed it.',
    lines: [
      { text: '7 friends.', shot: 'The whole group, any old photo' },
      { text: '4 cities.', shot: 'A map, or four airport/departure shots' },
      { text: '1 group chat.', shot: 'The group chat on a phone' },
      { text: '312 messages.', shot: 'Fast scroll through the chat' },
      { text: '0 dates that work.', shot: 'A messy calendar, or someone face-palming' },
      { text: 'So: 1 link.', shot: 'Sending the board link in the chat' },
      { text: 'Everyone tapped their free days.', shot: 'Board: painting days on a phone' },
      { text: 'The best week found itself.', shot: 'Board: everyone heat view' },
      { text: '0 fights.', shot: 'The trip itself: everyone laughing' },
    ],
    tagline: 'Planned in one link. Free.',
  },
  {
    id: 'chat-vs-link',
    name: 'Group chat vs. the link',
    idea: 'Every friend group has lived the first half. The second half is the board.',
    lines: [
      { text: '"when works for everyone?"', shot: 'Chat screenshot: the question' },
      { text: '"idk"', shot: 'Chat: a one-word reply' },
      { text: '"maybe july??"', shot: 'Chat: a vague reply' },
      { text: '"wait who\'s driving"', shot: 'Chat: the topic changes' },
      { text: '3 weeks later…', shot: 'Calendar pages flipping, or a clock' },
      { text: 'still no dates.', shot: 'Phone face-down on a table' },
      { text: 'Then one link.', shot: 'Board: the share link' },
      { text: 'Tap your days. Done by dinner.', shot: 'Board: best window, then dinner table' },
    ],
    tagline: 'One link for the whole trip. Free.',
  },
  {
    id: 'organizer',
    name: 'POV: the organizer',
    idea: 'For the friend who always ends up planning everything (that friend shares these).',
    lines: [
      { text: "POV: you're the friend who plans everything", shot: 'You, tired, on your phone' },
      { text: '8 people.', shot: 'Group photo' },
      { text: '8 schedules.', shot: 'Calendars, work shifts, a kid\'s soccer schedule' },
      { text: '8 opinions about the cabin.', shot: 'Cabin listings on a laptop' },
      { text: 'This year I sent one link.', shot: 'Board: sending the link' },
      { text: 'They picked their days.', shot: 'Board: people\'s names filling in' },
      { text: 'The week picked itself.', shot: 'Board: locked week' },
      { text: 'I just showed up.', shot: 'You arriving, bag over shoulder, relaxed' },
    ],
    tagline: 'Let the link do the organizing. Free, no accounts.',
  },
  {
    id: 'no-signal',
    name: 'No signal',
    idea: 'The Yellowstone story: the plan kept working where the phones didn\'t.',
    needs: 'Offline mode ("Get ready for the trip"), which is Phase 3 of the plan. Shoot it on the Yellowstone trip.',
    lines: [
      { text: 'Yellowstone.', shot: 'Park entrance sign or a big landscape' },
      { text: 'No signal for 3 days.', shot: 'Phone status bar: No Service' },
      { text: "Didn't matter.", shot: 'Someone checking their phone, unbothered' },
      { text: 'The whole plan was already on our phones.', shot: 'Board: the day-by-day plan, offline' },
      { text: 'Day 1: Old Faithful.', shot: 'Old Faithful' },
      { text: 'Day 2: Grand Prismatic.', shot: 'Grand Prismatic' },
      { text: 'Day 3: we got lost on purpose.', shot: 'A trail, a lake, the car' },
    ],
    tagline: 'Works with no signal. Free.',
  },
  {
    id: 'didnt-need',
    name: "What we didn't need",
    idea: 'A list of absences, which is the whole philosophy: small, free, nothing to sign up for.',
    lines: [
      { text: 'No app to download.', shot: 'App store page, swiped away' },
      { text: 'No accounts.', shot: 'A sign-up form, closed' },
      { text: 'No spreadsheet.', shot: 'A scary spreadsheet, scrolled fast' },
      { text: 'No ads.', shot: 'Board on a phone, clean' },
      { text: 'Just one link.', shot: 'Board: the link in the group chat' },
      { text: 'And 9 friends at the lake.', shot: 'The trip: everyone at the water' },
    ],
    tagline: 'Free. Made by one person.',
  },
];
