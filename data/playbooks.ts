/**
 * Playbooks for Bayani-1's v0 data (B20). Invented, English, drawn from how Philippine volunteer groups run their work:
 * the scenario walks (a Rotaract fun run with five teams, a church youth feeding program, a youth club's tutoring
 * year, a co-hosted coastal cleanup, a JCI-style project), a volunteer-run community tech conference, and a medical
 * mission. No real group or person is named.
 *
 * Each usual step has: its general title (the Practice), the team that owns it, the day it's usually done relative to
 * the start (negative is before), how often groups include it, how often it's forgotten until the last week, what
 * usually comes before it, and wordings people actually write. `train` wordings are used to build training data;
 * `test` wordings are held out and appear only in the test set.
 */

export type Step = {
  title: string; team: string; day: number; rate: number; late?: number; after?: string[];
  train: string[]; test: string[];
};
export type OneOff = { title: string; team: string; day: number };
export type Playbook = {
  kind: string; label: string; teams: string[]; steps: Step[]; oneOffs: OneOff[];
  groups: { train: string[]; test: string }; projectTitle: (year: number) => string;
};

const s = (title: string, team: string, day: number, rate: number, train: string[], test: string[], late = 0, after: string[] = []): Step =>
  ({ title, team, day, rate, late, after, train, test });

export const PLAYBOOKS: Playbook[] = [
  {
    kind: "fun-run", label: "fun run", projectTitle: (y) => `Fun run ${y}`,
    teams: ["Volunteers", "Venue & permits", "Creatives", "Sponsors & partners", "Finance"],
    groups: { train: ["Lakad Runners", "Uplands Rotaract"], test: "Mabolo Striders" },
    steps: [
      s("Book the venue", "Venue & permits", -60, 1, ["Reserve the covered court", "Book the school oval for race day", "Secure the venue"], ["Lock in the plaza for the run"]),
      s("Get the barangay permit", "Venue & permits", -21, 1, ["Letter to Kapitan for the road closure", "Barangay permit for the route", "Ask the barangay for a permit"], ["Road use clearance from the barangay hall"], 0.35, ["Book the venue"]),
      s("Get the LGU traffic clearance", "Venue & permits", -18, 0.7, ["City traffic office clearance", "Coordinate with traffic enforcers"], ["Request traffic marshals from the city"], 0.3, ["Get the barangay permit"]),
      s("Map the route", "Venue & permits", -40, 1, ["Draw the 5K route map", "Measure the route with a bike"], ["Finalize the course map"], 0, ["Book the venue"]),
      s("Call for sponsors", "Sponsors & partners", -50, 1, ["Send sponsorship letters", "Pitch deck to sponsors"], ["Reach out to possible sponsors"]),
      s("Collect sponsor logos", "Sponsors & partners", -24, 0.9, ["Get the logos from sponsors", "Logo files for the shirt"], ["Ask partners for their logo files"], 0.3, ["Call for sponsors"]),
      s("Design the race shirt", "Creatives", -28, 0.9, ["Shirt design draft", "Finalize the singlet design"], ["Race tee artwork"], 0, ["Collect sponsor logos"]),
      s("Print race bibs", "Creatives", -14, 1, ["Print the bib numbers", "Bibs to the printer"], ["Order race numbers from the print shop"], 0.2, ["Collect sponsor logos"]),
      s("Open runner registration", "Creatives", -45, 1, ["Registration form for runners", "Post the sign-up link"], ["Launch the runner sign-ups"]),
      s("Recruit route marshals", "Volunteers", -20, 1, ["Call for marshals", "Sign up 20 marshals for the route"], ["Find volunteers to guard the route"]),
      s("Brief the marshals", "Volunteers", -2, 1, ["Marshal briefing on Friday night", "Orientation for route volunteers"], ["Walk the marshals through their posts"], 0.25, ["Recruit route marshals"]),
      s("Set up water stations", "Volunteers", 0, 1, ["Water stations at km 2 and km 4", "Hydration stations on the route"], ["Water tables along the course"]),
      s("Arrange first aid", "Venue & permits", -10, 0.8, ["Ask the Red Cross for a first aid team", "Ambulance on standby"], ["Medics at the finish line"], 0.4),
      s("Collect receipts from each team", "Finance", 3, 0.9, ["Gather all receipts", "Liquidation of expenses"], ["Turn in receipts to the treasurer"]),
      s("Thank the barangay", "Volunteers", 5, 0.7, ["Thank-you letter to the barangay", "Courtesy visit after the run"], ["Send thanks to the barangay officials"], 0, ["Get the barangay permit"]),
    ],
    oneOffs: [{ title: "Book a shuttle from the mall", team: "Venue & permits", day: -7 }, { title: "Rent a generator for the stage", team: "Venue & permits", day: -3 }, { title: "Borrow a podium from the school", team: "Creatives", day: -2 }],
  },
  {
    kind: "feeding-program", label: "feeding program", projectTitle: (y) => `Saturday feeding, ${y} first quarter`,
    teams: ["Kitchen", "Supplies", "Volunteers", "Kids & program", "Finance"],
    groups: { train: ["St. Joseph Youth Ministry", "Kusina ng Bayan Volunteers"], test: "Holy Family Youth" },
    steps: [
      s("Plan the menu", "Kitchen", -10, 1, ["Decide the menu for the month", "Menu plan with the nutritionist"], ["Pick the dishes for the quarter"]),
      s("Buy the ingredients", "Supplies", -2, 1, ["Market run on Friday", "Buy rice, chicken and vegetables"], ["Grocery list and purchase"], 0, ["Plan the menu"]),
      s("Ask for rice donations", "Supplies", -14, 0.8, ["Request sacks of rice from parishioners", "Rice drive announcement after mass"], ["Ask donors for rice"]),
      s("Borrow the parish kitchen", "Kitchen", -21, 0.9, ["Reserve the parish kitchen", "Ask the parish office for the kitchen"], ["Book the church kitchen"]),
      s("Schedule the cooks", "Volunteers", -7, 1, ["Cooking shifts for Saturday", "Who's cooking this week"], ["Assign the kitchen crew"]),
      s("Register the children", "Kids & program", -14, 1, ["List of kids for the feeding", "Coordinate with the barangay health worker for the list"], ["Enroll the children"]),
      s("Weigh the children", "Kids & program", 0, 0.7, ["Weighing and height check", "Monthly weight monitoring"], ["Measure the kids' weight"], 0.3, ["Register the children"]),
      s("Prepare a short activity", "Kids & program", -3, 0.8, ["Story time for the kids", "Games before lunch"], ["A lesson for the children"]),
      s("Clean up the hall", "Volunteers", 0, 1, ["Wash the pots and clean the hall", "Cleanup crew after lunch"], ["Tidy the parish hall afterwards"]),
      s("Keep the receipts", "Finance", 1, 1, ["File the market receipts", "Record expenses for the week"], ["Hand receipts to the treasurer"], 0, ["Buy the ingredients"]),
      s("Report to the parish council", "Finance", 7, 0.7, ["Monthly report to the parish", "Update the parish council"], ["Send the parish a summary"]),
    ],
    oneOffs: [{ title: "Borrow a second stove from a neighbour", team: "Kitchen", day: -1 }, { title: "Buy plastic chairs for the kids", team: "Supplies", day: -5 }],
  },
  {
    kind: "tutoring-program", label: "tutoring program", projectTitle: (y) => `Tutoring term, ${y}`,
    teams: ["Tutors", "Learners", "Materials", "School partners"],
    groups: { train: ["Kabataan Tutors", "Learn Together Club"], test: "Pag-asa Reading Circle" },
    steps: [
      s("Agree with the school", "School partners", -30, 1, ["Meet the principal", "MOA with the elementary school"], ["Sign up the partner school"]),
      s("Get the list of learners", "Learners", -20, 1, ["Ask the teachers for struggling readers", "List of learners from the school"], ["Collect names of kids who need help"], 0, ["Agree with the school"]),
      s("Recruit tutors", "Tutors", -25, 1, ["Call for volunteer tutors", "Sign up college students to tutor"], ["Find tutors for the term"]),
      s("Train the tutors", "Tutors", -7, 0.9, ["Tutor orientation", "Reading method training"], ["Prepare the tutors"], 0.3, ["Recruit tutors"]),
      s("Get parent consent", "Learners", -10, 0.9, ["Consent forms for parents", "Parent permission slips"], ["Ask parents to sign the waiver"], 0.4, ["Get the list of learners"]),
      s("Prepare reading materials", "Materials", -5, 1, ["Print worksheets", "Photocopy the reading cards"], ["Make copies of the lessons"]),
      s("Test the learners first", "Learners", 0, 0.8, ["Pre-test reading levels", "Baseline assessment"], ["Check reading levels at the start"], 0, ["Get the list of learners"]),
      s("Log tutor hours", "Tutors", 14, 1, ["Attendance sheet for tutors", "Record volunteer hours"], ["Keep track of tutoring hours"]),
      s("Test the learners at the end", "Learners", 60, 0.8, ["Post-test", "End-of-term assessment"], ["Final reading check"], 0, ["Test the learners first"]),
      s("Hold a recognition day", "School partners", 70, 0.6, ["Awarding for learners and tutors", "Closing program with certificates"], ["Celebrate the end of the term"]),
    ],
    oneOffs: [{ title: "Find a new room after the flood", team: "School partners", day: 20 }, { title: "Borrow tablets from a sponsor", team: "Materials", day: -3 }],
  },
  {
    kind: "coastal-cleanup", label: "coastal cleanup", projectTitle: (y) => `Coastal cleanup, ${y}`,
    teams: ["Beach crew", "Logistics", "Partners", "Documentation"],
    groups: { train: ["Uplands Rotaract", "Isla Verde Volunteers"], test: "Bantay Dagat Youth" },
    steps: [
      s("Choose the beach", "Partners", -30, 1, ["Pick the cleanup site", "Ocular visit to the shoreline"], ["Scout the beach for the cleanup"]),
      s("Coordinate with the barangay", "Partners", -21, 1, ["Letter to the barangay captain", "Barangay go-signal for the cleanup"], ["Inform the barangay officials"], 0.3, ["Choose the beach"]),
      s("Ask the environment office", "Partners", -18, 0.6, ["Coordinate with CENRO", "Clearance from the environment office"], ["Notify the city environment office"], 0.4),
      s("Get sacks and gloves", "Logistics", -5, 1, ["Buy trash bags and gloves", "Borrow sacks from the barangay"], ["Prepare cleanup kits"], 0.2),
      s("Arrange the garbage truck", "Logistics", -7, 0.9, ["Ask the city for a garbage truck", "Haul-out schedule with the LGU"], ["Book the waste pickup"], 0.4, ["Coordinate with the barangay"]),
      s("Sign up volunteers", "Beach crew", -14, 1, ["Volunteer form for the cleanup", "Call for beach volunteers"], ["Gather people for the cleanup"]),
      s("Safety briefing", "Beach crew", 0, 0.9, ["Briefing before we start", "Safety talk on sharp objects"], ["Remind everyone about safety"]),
      s("Count and sort the waste", "Documentation", 0, 0.8, ["Waste audit by type", "Tally sheet for the trash"], ["Sort the trash and record it"]),
      s("Take photos for the report", "Documentation", 0, 1, ["Before and after photos", "Photo documentation"], ["Document the cleanup"]),
      s("Send the report to the partners", "Documentation", 7, 0.7, ["Report to the sponsoring club", "Share results with partners"], ["Write up the results"], 0, ["Count and sort the waste"]),
    ],
    oneOffs: [{ title: "Rent a boat to reach the sandbar", team: "Logistics", day: -2 }, { title: "Borrow a megaphone from the school", team: "Beach crew", day: -1 }],
  },
  {
    kind: "community-conference", label: "community conference", projectTitle: (y) => `Community tech conference ${y}`,
    teams: ["Lead organizers", "Communications", "Venue", "Design", "Sponsors", "Speakers", "Attendee experience", "AV", "Volunteers"],
    groups: { train: ["Visayas Developers Community", "Open Source Cebu Meetup"], test: "Island Makers Community" },
    steps: [
      s("Get approval from the organizing body", "Lead organizers", -150, 1, ["Submit the application to the national organizers", "Approval of the budget and venue"], ["Clear the event with the parent organization"]),
      s("Book the venue", "Venue", -180, 1, ["Sign the venue contract", "Reserve the convention hall"], ["Lock in the event hall"]),
      s("Publish the design styleguide", "Design", -120, 0.8, ["Brand guide for the event", "Editorial and visual styleguide"], ["Share the event's look and tone"], 0, ["Book the venue"]),
      s("Announce the event", "Communications", -110, 1, ["Launch announcement", "Save the date post"], ["Tell the community the date"], 0, ["Get approval from the organizing body"]),
      s("Open the call for speakers", "Speakers", -100, 1, ["Call for papers", "Speaker application form"], ["Invite talk proposals"], 0, ["Announce the event"]),
      s("Open the call for sponsors", "Sponsors", -100, 1, ["Exhibitor prospectus", "Send the sponsorship deck"], ["Invite companies to exhibit"], 0, ["Announce the event"]),
      s("Open the call for volunteers", "Volunteers", -60, 1, ["Volunteer sign-up form", "Recruit day-of crew"], ["Find people to help on the day"], 0, ["Announce the event"]),
      s("Select the talks", "Speakers", -60, 1, ["Review the speaker submissions", "Shortlist the talks"], ["Choose the program"], 0, ["Open the call for speakers"]),
      s("Open ticket sales", "Attendee experience", -75, 1, ["Launch registration", "Ticketing page live"], ["Start selling tickets"], 0, ["Announce the event"]),
      s("Order the swag", "Design", -35, 0.8, ["Shirts and lanyards to the printer", "Order the attendee kits"], ["Produce the giveaways"], 0.3, ["Publish the design styleguide"]),
      s("Plan the livestream", "AV", -21, 0.7, ["Livestream and recording plan", "Test the streaming setup"], ["Prepare the video coverage"], 0.3),
      s("Review all outgoing materials", "Communications", -30, 0.9, ["Comms review of every post", "Proofread the announcements"], ["Check materials before they go out"]),
      s("Brief the volunteers", "Volunteers", -3, 1, ["Volunteer orientation", "Day-of briefing for the crew"], ["Walk the crew through the day"], 0.2, ["Open the call for volunteers"]),
      s("Thank speakers and sponsors", "Communications", 7, 0.9, ["Thank-you posts", "Send certificates to speakers"], ["Thank everyone publicly"]),
    ],
    oneOffs: [{ title: "Find a backup venue after the typhoon warning", team: "Venue", day: -10 }, { title: "Arrange a ferry discount for attendees", team: "Attendee experience", day: -30 }],
  },
  {
    kind: "medical-mission", label: "medical mission", projectTitle: (y) => `Medical mission, ${y}`,
    teams: ["Medical", "Pharmacy", "Registration", "Logistics", "Partners"],
    groups: { train: ["Lingap Medical Volunteers", "Sto. Niño Parish Health Ministry"], test: "Kalinga Health Brigade" },
    steps: [
      s("Coordinate with the health office", "Partners", -30, 1, ["Letter to the municipal health office", "Coordinate with the RHU"], ["Inform the local health center"], 0.3),
      s("Recruit doctors and nurses", "Medical", -28, 1, ["Invite volunteer doctors", "Sign up nurses for the mission"], ["Find medical volunteers"]),
      s("List the medicines needed", "Pharmacy", -21, 1, ["Medicine list from the doctors", "Forecast the meds"], ["Decide which medicines to bring"], 0, ["Recruit doctors and nurses"]),
      s("Get medicine donations", "Pharmacy", -14, 0.9, ["Ask pharma companies for donations", "Medicine drive"], ["Collect donated medicines"], 0.2, ["List the medicines needed"]),
      s("Check medicine expiry dates", "Pharmacy", -2, 0.8, ["Inventory and expiry check", "Sort the meds by expiry"], ["Look over the medicines before packing"], 0.4, ["Get medicine donations"]),
      s("Announce to the community", "Partners", -10, 1, ["Ask the barangay to announce the schedule", "Post the schedule at the health center"], ["Let residents know the date"]),
      s("Set up patient registration", "Registration", -1, 1, ["Registration forms and numbers", "Patient intake table"], ["Prepare the sign-in for patients"]),
      s("Arrange transport for the team", "Logistics", -5, 0.9, ["Van for the doctors", "Transport to the barangay"], ["Get a ride for the medical team"], 0.3),
      s("Pack the supplies", "Logistics", -1, 1, ["Pack the boxes the night before", "Load the supplies"], ["Get the boxes ready"], 0, ["Check medicine expiry dates"]),
      s("Record patients seen", "Registration", 0, 1, ["Tally of patients served", "Patient log"], ["Count the patients"]),
      s("Report to the health office", "Partners", 7, 0.7, ["Send the summary to the RHU", "Report patients served"], ["Share the numbers with the health office"], 0, ["Record patients seen"]),
    ],
    oneOffs: [{ title: "Rent a generator for the clinic", team: "Logistics", day: -1 }, { title: "Borrow tents from the barangay", team: "Logistics", day: -3 }],
  },
];
