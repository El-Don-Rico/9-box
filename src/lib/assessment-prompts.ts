export const assessmentPrompts: Record<string, { self?: string[]; manager?: string[] }> = {
  performance: {
    self: [
      "Did you meet your deliverables and deadlines this quarter?",
      "How was the quality of your output compared to expectations?",
      "Were you self-sufficient, or did you need significant support?",
    ],
    manager: [
      "Did this person consistently meet deadlines and quality standards?",
      "How did their output compare to peers in a similar role?",
      "Were there any notable wins or misses this quarter?",
    ],
  },
  growthReadiness: {
    manager: [
      "Is this person actively developing new skills or taking on stretch work?",
      "Could they step into a more senior role within the next 6-12 months?",
      "Do they seek feedback and apply it?",
    ],
  },
  valCustomerFirst: {
    self: [
      "Did you proactively consider client outcomes in your decisions?",
      "Did you go beyond what was asked to deliver a better result for the client?",
    ],
    manager: [
      "Has this person demonstrated ownership of client outcomes?",
      "Have clients or colleagues noted their client-first approach?",
    ],
  },
  valStepIntoArena: {
    self: [
      "Did you volunteer for difficult tasks or conversations this quarter?",
      "Did you speak up when you disagreed or saw a problem?",
    ],
    manager: [
      "Has this person taken initiative on challenging work without being asked?",
      "Do they lean into difficult conversations rather than avoiding them?",
    ],
  },
  valFlockToProblems: {
    self: [
      "Did you actively seek out and address problems before they escalated?",
      "Did you help a colleague or team solve a challenge this quarter?",
    ],
    manager: [
      "Does this person gravitate toward problems rather than away from them?",
      "Have they proactively identified and resolved issues?",
    ],
  },
  valGiveEnergy: {
    self: [
      "Did you contribute positively to team morale and energy this quarter?",
      "Did you support or uplift a colleague who was struggling?",
    ],
    manager: [
      "Does this person lift the energy of those around them?",
      "Do teammates seek them out for collaboration and support?",
    ],
  },
  engagement: {
    self: [
      "How motivated do you feel about your day-to-day work?",
      "Do you feel connected to the team's goals and mission?",
    ],
    manager: [
      "Does this person show enthusiasm and discretionary effort?",
      "Are there signs of disengagement — withdrawal, minimal participation?",
    ],
  },
};
