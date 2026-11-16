/**
 * Playbooks for Bayani-1's v0 data (B20). Invented, English, drawn from how Philippine volunteer groups run their work:
 * the scenario walks (a Rotaract fun run with five teams, a church youth feeding program, a youth club's tutoring
 * year, a co-hosted coastal cleanup, a JCI-style project), a volunteer-run community tech conference, and a medical
 * mission. No real group or person is named.
 *
 * v1 (2026-11-16): seven more kinds, written from how Philippine groups describe their own projects in public posts and
 * guides (Rotary and Rotaract clubs, JCI chapters, Red Cross Youth councils, disaster-relief volunteer networks, parish
 * and campus groups, DepEd's Brigada Eskwela and DENR planting guidance): relief operation, bloodletting drive, school
 * supplies drive, mangrove planting, Christmas gift-giving, livelihood training and a fundraising event. Steps use the
 * words officers actually use (MOA, ocular, solicitation letters, masterlist, claim stubs, turnover, liquidation,
 * accomplishment report). Groups, people and places are invented; nothing is copied from a named group.
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
      s("Group the learners by reading level", "Learners", 2, 0.7, ["Divide the kids into groups of 7 to 10", "Group by level after the pre-test"], ["Sort the kids into small groups"], 0, ["Test the learners first"]),
      s("Orient the parents", "Learners", -3, 0.6, ["Parents' orientation", "Meeting with the parents before the first session"], ["Explain the program to the parents"], 0.3),
      s("Prepare snacks for the sessions", "Materials", 0, 0.8, ["Snacks every Saturday", "Merienda for the kids"], ["Food for the learners each week"]),
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
  {
    kind: "relief-operation", label: "relief operation", projectTitle: (y) => `Typhoon relief, ${y}`,
    teams: ["Donations", "Repacking", "Distribution", "Coordination", "Finance", "Documentation"],
    groups: { train: ["Bayanihan Youth Responders", "Lingkod Bayan Volunteers"], test: "Agos Relief Network" },
    steps: [
      s("Open the donation drive", "Donations", -6, 1, ["Post the call for donations", "Announce in-kind and GCash donations", "Donation drive post on the page"], ["Launch the call for relief goods"]),
      s("Set up the drop-off point", "Donations", -6, 1, ["Find a drop-off site for goods", "Drop-off area at the parish hall", "Where to receive donations"], ["Prepare a place to receive donations"]),
      s("Coordinate with the MDRRMO", "Coordination", -5, 1, ["Call the municipal DRRM office", "Ask the MDRRMO which barangays were hit", "Coordinate with the LGU disaster office"], ["Check in with the town's disaster office"], 0.2),
      s("Get the masterlist of families", "Coordination", -3, 1, ["Ask the barangay for the list of affected families", "Validated list from the kapitan", "Family list from the evacuation center"], ["Collect the names of affected households"], 0.35, ["Coordinate with the MDRRMO"]),
      s("Decide what goes in a relief pack", "Repacking", -5, 1, ["Relief pack contents", "Pack list: rice, sardines, noodles, water", "What to put in each family pack"], ["Agree on the contents of each pack"]),
      s("Log the donations received", "Donations", -4, 0.9, ["Inventory of in-kind donations", "Donation tracker sheet", "Record who gave what"], ["Keep a list of donated goods"], 0.3, ["Set up the drop-off point"]),
      s("Call for repacking volunteers", "Repacking", -4, 1, ["Volunteers needed for repacking", "Sign-up sheet for repacking shifts", "Ask members to help repack"], ["Find people to pack the goods"]),
      s("Buy what's short", "Finance", -3, 0.8, ["Buy rice with the cash donations", "Purchase missing items for the packs", "Market run for canned goods"], ["Use cash gifts to fill the gaps"], 0, ["Log the donations received"]),
      s("Repack the relief goods", "Repacking", -2, 1, ["Repacking night", "Pack 300 family packs", "Repacking at the hall"], ["Assemble the family packs"], 0, ["Decide what goes in a relief pack", "Call for repacking volunteers"]),
      s("Print distribution stubs", "Distribution", -2, 0.8, ["Claim stubs for families", "Numbered stubs for the list", "Make claim cards"], ["Prepare tickets for each household"], 0.4, ["Get the masterlist of families"]),
      s("Arrange the trucks", "Distribution", -2, 1, ["Borrow a truck for the goods", "Ask a member's company for a delivery truck", "Transport to the evacuation center"], ["Get vehicles to haul the packs"], 0.3),
      s("Distribute the relief packs", "Distribution", 0, 1, ["Distribution at the evacuation center", "Hand out packs with the barangay", "Relief distribution day"], ["Give out the packs to families"], 0, ["Repack the relief goods", "Arrange the trucks"]),
      s("Post an update for donors", "Documentation", 2, 0.9, ["Post photos and totals", "Thank-you post with the number of families served", "Donor update on the page"], ["Tell donors where their help went"], 0, ["Distribute the relief packs"]),
      s("Liquidate the cash donations", "Finance", 10, 0.8, ["Liquidation report of cash received", "Receipts for purchases", "Account for GCash donations"], ["Report how the cash was spent"], 0, ["Buy what's short"]),
    ],
    oneOffs: [{ title: "Rent a boat to reach the flooded sitio", team: "Distribution", day: -1 }, { title: "Set up a community kitchen for hot meals", team: "Repacking", day: -1 }, { title: "Borrow a generator for the repacking site", team: "Repacking", day: -2 }],
  },
  {
    kind: "blood-drive", label: "bloodletting drive", projectTitle: (y) => `Bloodletting drive, ${y}`,
    teams: ["Partners", "Promotions", "Donor care", "Venue", "Documentation"],
    groups: { train: ["Dugong Bayani Youth", "Campus Lifesavers Club"], test: "Pulso Blood Advocates" },
    steps: [
      s("Book the date with the Red Cross chapter", "Partners", -45, 1, ["Request a mobile blood donation with the chapter", "Schedule the blood bank team", "Letter to the Red Cross for a bloodletting date"], ["Confirm the blood services team's schedule"]),
      s("Reserve the venue", "Venue", -30, 1, ["Book the gym for the bloodletting", "Reserve the lobby", "Request the multipurpose hall"], ["Secure a hall for the donation"], 0, ["Book the date with the Red Cross chapter"]),
      s("Set a donor target", "Partners", -30, 0.8, ["Target 150 blood bags", "Agree on the number of donors", "Donor goal with the chapter"], ["Decide how many donors to aim for"]),
      s("Open donor pre-registration", "Promotions", -21, 1, ["Pre-registration form for donors", "Google form for donors", "Sign-up link for blood donors"], ["Let donors sign up early"]),
      s("Post donor eligibility reminders", "Promotions", -14, 0.9, ["Dos and don'ts before donating", "Who can donate: weight, age, sleep", "Eligibility poster"], ["Tell donors how to prepare"], 0, ["Open donor pre-registration"]),
      s("Get parental consent for young donors", "Donor care", -7, 0.6, ["Consent forms for 16 and 17 year olds", "Parent permission for minors"], ["Waivers from parents of underage donors"], 0.4),
      s("Ask sponsors for snacks", "Partners", -14, 0.9, ["Snacks for donors from a bakery", "Juice and biscuits sponsor"], ["Get food for donors after donating"], 0.3),
      s("Prepare tokens for donors", "Donor care", -5, 0.7, ["Donor shirts", "Certificates for donors", "Giveaways for donors"], ["Small gifts for everyone who donates"]),
      s("Set up the donor stations", "Venue", -1, 1, ["Beds and chairs for donors", "Screening and extraction areas", "Arrange the hall the night before"], ["Lay out the donation area"], 0, ["Reserve the venue"]),
      s("Assign volunteers to each station", "Donor care", -2, 1, ["Volunteers for registration and canteen", "Station assignments", "Who's at screening and recovery"], ["Give each volunteer a post"], 0.3),
      s("Count the blood bags collected", "Documentation", 0, 1, ["Tally of donors and bags", "Count of deferred donors", "Final count with the chapter"], ["Record how many units were collected"]),
      s("Thank donors and partners", "Promotions", 2, 0.9, ["Thank-you post with the total bags", "Letters of thanks to the chapter and sponsors"], ["Post our thanks to everyone who gave"], 0, ["Count the blood bags collected"]),
    ],
    oneOffs: [{ title: "Recognize the youngest and eldest donors", team: "Donor care", day: 0 }, { title: "Add a blood typing booth", team: "Venue", day: 0 }],
  },
  {
    kind: "school-supplies-drive", label: "school supplies drive", projectTitle: (y) => `Balik-eskwela drive, ${y}`,
    teams: ["School partners", "Donations", "Packing", "Program", "Finance"],
    groups: { train: ["Lingap Eskwela Club", "Batang Matatag Volunteers"], test: "Silid-Aralan Friends" },
    steps: [
      s("Coordinate with the school principal", "School partners", -40, 1, ["Meet the principal about Brigada", "Letter to the school head", "Ask the school what they need"], ["Talk to the head teacher"]),
      s("Get the class list per grade", "School partners", -30, 1, ["Number of learners per grade", "Enrollment count from the school", "Class list from the advisers"], ["Find out how many pupils there are"], 0.2, ["Coordinate with the school principal"]),
      s("Sign the MOA with the school", "School partners", -30, 0.6, ["MOA for the adopt-a-school", "Memorandum of agreement with the school", "Partnership agreement draft"], ["Put the partnership in writing"], 0.3, ["Coordinate with the school principal"]),
      s("Send solicitation letters", "Donations", -35, 1, ["Solicitation letters to companies", "Ask businesses for notebooks", "Donation request letters"], ["Write to possible donors"]),
      s("Decide the school kit contents", "Packing", -25, 1, ["What's in each school kit", "Kit list: notebooks, pencils, crayons", "Kit per grade level"], ["Agree what goes in each bag"], 0, ["Get the class list per grade"]),
      s("Track pledges and donations", "Donations", -14, 0.9, ["Pledge tracker", "List of donors and items", "Who promised what"], ["Keep count of what was pledged"], 0.3, ["Send solicitation letters"]),
      s("Buy the remaining supplies", "Finance", -7, 0.8, ["Divisoria run for supplies", "Buy bags in bulk", "Purchase the missing items"], ["Shop for what's still missing"], 0.2, ["Track pledges and donations"]),
      s("Pack the school kits", "Packing", -3, 1, ["Packing day for school bags", "Assemble 200 kits", "Bag the supplies per grade"], ["Put together the kits"], 0, ["Decide the school kit contents", "Buy the remaining supplies"]),
      s("Join the Brigada Eskwela clean-up", "Program", -7, 0.7, ["Classroom cleaning and repainting", "Brigada work day", "Paint the chairs"], ["Help fix up the classrooms"], 0, ["Coordinate with the school principal"]),
      s("Prepare the turnover program", "Program", -2, 0.9, ["Program flow for the turnover", "Emcee and short program", "Turnover ceremony script"], ["Plan the handover event"], 0.3),
      s("Hand over the kits", "Program", 0, 1, ["Turnover of school supplies", "Distribution per classroom", "Give the kits to the learners"], ["Distribute the bags to the kids"], 0, ["Pack the school kits"]),
      s("Get the acknowledgement receipt", "School partners", 1, 0.7, ["Deed of donation signed by the principal", "Acknowledgement from the school", "Signed receipt of donated items"], ["Have the school sign for the donation"], 0.4, ["Hand over the kits"]),
      s("Submit the accomplishment report", "Finance", 14, 0.7, ["Accomplishment report with photos", "Report to the district", "Project report and liquidation"], ["Write up what we did"], 0, ["Hand over the kits"]),
    ],
    oneOffs: [{ title: "Add hygiene kits for kindergarten", team: "Packing", day: -5 }, { title: "Rent a jeep to reach the upland school", team: "Program", day: -1 }, { title: "Donate a water dispenser to the school", team: "School partners", day: 0 }],
  },
  {
    kind: "tree-planting", label: "mangrove planting", projectTitle: (y) => `Mangrove planting, ${y}`,
    teams: ["Partners", "Site", "Volunteers", "Logistics", "Documentation"],
    groups: { train: ["Luntiang Kabataan", "Bakawan Guardians"], test: "Ugat Green Circle" },
    steps: [
      s("Coordinate with the CENRO", "Partners", -45, 1, ["Letter to the DENR CENRO", "Ask the environment office for a planting site", "Coordinate with the DENR"], ["Get the environment office on board"]),
      s("Get the barangay's go-signal", "Partners", -30, 1, ["Courtesy call to the barangay", "Barangay resolution for the site", "Inform the kapitan"], ["Clear the activity with the barangay"], 0.3),
      s("Do an ocular of the site", "Site", -30, 1, ["Site visit before the planting", "Check the tide and the mudflat", "Ocular inspection"], ["Visit the planting area first"], 0, ["Coordinate with the CENRO"]),
      s("Request the seedlings", "Partners", -21, 1, ["Ask CENRO for propagules", "Order seedlings from the nursery", "500 bakawan seedlings"], ["Secure the planting materials"], 0.3, ["Coordinate with the CENRO"]),
      s("Check the tide schedule", "Site", -7, 0.8, ["Low tide on the planting day", "Tide table for the date"], ["Confirm the tide for the morning"], 0.3, ["Do an ocular of the site"]),
      s("Recruit planters", "Volunteers", -21, 1, ["Call for volunteers to plant", "Sign-up for the planting", "Invite partner orgs to join"], ["Find people to do the planting"]),
      s("Arrange the orientation on planting", "Partners", -5, 0.8, ["Short talk from the CENRO on mangroves", "How to plant propagules briefing"], ["Have an expert explain how to plant"], 0.2),
      s("Prepare gloves, boots and stakes", "Logistics", -3, 0.9, ["Bamboo stakes and twine", "Gloves and boots for volunteers"], ["Get the tools for planting"]),
      s("Arrange transport to the site", "Logistics", -5, 0.9, ["Jeep to the coast", "Rent a van for volunteers"], ["Get everyone to the shore"], 0.3),
      s("Count the seedlings planted", "Documentation", 0, 1, ["Tally of seedlings planted", "Map where we planted", "Geotag the site"], ["Record how many went in"]),
      s("Send the report to the CENRO", "Documentation", 10, 0.7, ["Report with photos to DENR", "Planting report"], ["Share the planting results with the environment office"], 0, ["Count the seedlings planted"]),
      s("Monitor survival after a month", "Site", 30, 0.6, ["Go back to count the surviving seedlings", "One-month survival check"], ["Check how many seedlings lived"], 0, ["Count the seedlings planted"]),
    ],
    oneOffs: [{ title: "Build a bamboo fence around the seedlings", team: "Site", day: 5 }, { title: "Add a coastal cleanup after planting", team: "Volunteers", day: 0 }],
  },
  {
    kind: "gift-giving", label: "Christmas gift-giving", projectTitle: (y) => `Pamaskong handog, ${y}`,
    teams: ["Donations", "Packing", "Beneficiaries", "Program", "Finance"],
    groups: { train: ["Paskong Bayanihan Circle", "Himig Parish Youth"], test: "Parol Outreach Friends" },
    steps: [
      s("Choose the community", "Beneficiaries", -40, 1, ["Pick the barangay for the outreach", "Ask the parish which area to serve", "Decide where we'll go"], ["Find the families to serve"]),
      s("Get the list of families from the barangay", "Beneficiaries", -25, 1, ["Beneficiary list from the barangay", "Indigent families list from the social worker", "120 families list"], ["Ask for the names of families"], 0.3, ["Choose the community"]),
      s("Send solicitation letters", "Donations", -35, 1, ["Ask friends and companies for donations", "Solicitation for noche buena packs"], ["Reach out to donors for the packs"]),
      s("Decide what goes in the gift bags", "Packing", -25, 1, ["Noche buena pack contents", "Gift pack: pasta, ham, fruit", "Gift bag list"], ["Agree what each family gets"]),
      s("Buy the goods", "Finance", -10, 1, ["Shopping at the grocery", "Bulk buy at the palengke", "Buy items for 120 bags"], ["Purchase the items for the packs"], 0.2, ["Decide what goes in the gift bags"]),
      s("Hand out claim stubs", "Beneficiaries", -5, 0.9, ["Tickets for each family", "Distribute stubs through the barangay"], ["Give families their claim tickets"], 0.4, ["Get the list of families from the barangay"]),
      s("Pack the gift bags", "Packing", -2, 1, ["Packing night", "Stuff the bags"], ["Fill the gift bags"], 0, ["Buy the goods"]),
      s("Plan the short program", "Program", -7, 0.8, ["Games and a short program for kids", "Prayer, games, and snacks"], ["Prepare activities for the day"]),
      s("Hold the gift-giving", "Program", 0, 1, ["Gift-giving at the chapel", "Distribution day"], ["Give out the packs"], 0, ["Pack the gift bags"]),
      s("Thank the donors", "Donations", 3, 0.9, ["Thank-you post with photos", "Message every donor"], ["Let donors know it happened"], 0, ["Hold the gift-giving"]),
      s("Post the accounting of donations", "Finance", 7, 0.7, ["List of donations and expenses", "Accounting of funds"], ["Show donors how the money was used"], 0.2, ["Buy the goods"]),
    ],
    oneOffs: [{ title: "Invite a Santa for the kids", team: "Program", day: -3 }, { title: "Add rice to every bag", team: "Packing", day: -4 }, { title: "Bring extra packs for walk-ins", team: "Beneficiaries", day: 0 }],
  },
  {
    kind: "livelihood-training", label: "livelihood training", projectTitle: (y) => `Livelihood training, ${y}`,
    teams: ["Partners", "Participants", "Training", "Materials", "Documentation"],
    groups: { train: ["Kabuhayan Circle", "Hanapbuhay Volunteers"], test: "Sikap Mothers' Club" },
    steps: [
      s("Ask what the community wants to learn", "Participants", -45, 0.9, ["Ask mothers which skill they want", "Needs survey in the barangay"], ["Find out what training people need"]),
      s("Partner with a TESDA trainer", "Partners", -35, 1, ["Request a trainer from TESDA", "Ask the training center for a facilitator"], ["Get a certified trainer"], 0.2, ["Ask what the community wants to learn"]),
      s("Coordinate with the social welfare office", "Partners", -30, 0.8, ["Ask the CSWDO for participants", "Coordinate with the city social welfare"], ["Work with the welfare office on the list"]),
      s("Register the participants", "Participants", -14, 1, ["List of solo parents and youth", "Registration of trainees", "Sign-up for the training"], ["Enroll the trainees"], 0.3, ["Coordinate with the social welfare office"]),
      s("Book the training venue", "Partners", -21, 1, ["Use the barangay hall", "Reserve the training room"], ["Find a place for the sessions"]),
      s("Buy training materials", "Materials", -7, 1, ["Ingredients for bread making", "Soap-making supplies", "Materials for the hands-on"], ["Get supplies for the practice"], 0.3, ["Partner with a TESDA trainer"]),
      s("Prepare starter kits", "Materials", -3, 0.7, ["Starter kits for graduates", "Tools to take home"], ["Put together kits so they can start selling"], 0.3),
      s("Hold the training sessions", "Training", 0, 1, ["Day 1 hands-on", "Training proper"], ["Run the workshop"], 0, ["Register the participants", "Buy training materials"]),
      s("Take attendance each session", "Documentation", 0, 0.9, ["Attendance sheet", "Sign-in per day"], ["Keep track of who came"]),
      s("Hold the graduation", "Training", 14, 0.8, ["Awarding of certificates", "Completion ceremony"], ["Give out the certificates"], 0, ["Hold the training sessions"]),
      s("Follow up with the graduates", "Participants", 60, 0.5, ["Check in after two months", "Who started selling"], ["See how the graduates are doing"], 0, ["Hold the graduation"]),
    ],
    oneOffs: [{ title: "Arrange childcare during the sessions", team: "Participants", day: 0 }, { title: "Lend sewing machines to the school", team: "Materials", day: -5 }],
  },
  {
    kind: "fundraising-event", label: "fundraising event", projectTitle: (y) => `Fundraising night, ${y}`,
    teams: ["Ways and means", "Program", "Promotions", "Venue", "Finance"],
    groups: { train: ["Bukas Palad Society", "Kapit-Bisig Club"], test: "Tanglaw Givers" },
    steps: [
      s("Get board approval for the event", "Ways and means", -60, 0.9, ["Present the concept at the GMM", "Board resolution for the fundraiser"], ["Have the officers approve the plan"]),
      s("Set the fundraising target", "Finance", -55, 1, ["Target net proceeds", "Budget and target"], ["Decide how much to raise"]),
      s("Book the venue", "Venue", -45, 1, ["Reserve the function room", "Book the cafe for the event"], ["Lock in a place for the night"], 0, ["Get board approval for the event"]),
      s("Prepare the sponsorship packages", "Ways and means", -45, 1, ["Sponsorship deck with tiers", "Gold, silver, bronze packages"], ["Write the offer for sponsors"]),
      s("Open ticket sales", "Promotions", -30, 1, ["Ticket form and GCash", "Early bird tickets"], ["Start selling tickets"], 0, ["Book the venue"]),
      s("Promote on social media", "Promotions", -28, 1, ["Pubmats for the event", "Countdown posts"], ["Post about the event online"]),
      s("Line up the raffle prizes", "Ways and means", -14, 0.7, ["Ask sponsors for raffle items", "Raffle prizes list"], ["Collect prizes for the raffle"], 0.3),
      s("Finalize the program flow", "Program", -7, 1, ["Run sheet for the night", "Emcee script"], ["Write the order of the program"], 0.2),
      s("Brief the volunteers", "Program", -1, 0.9, ["Volunteer briefing the night before", "Assign registration, cashier, and stage"], ["Tell volunteers their posts"], 0.3),
      s("Reconcile the ticket money", "Finance", 2, 1, ["Count the cash and GCash", "Match tickets sold to payments"], ["Check the money against tickets sold"]),
      s("Thank sponsors with an impact report", "Ways and means", 10, 0.7, ["Thank-you letters with photos", "Post-event report to sponsors"], ["Show sponsors what their support did"]),
      s("Send the financial report", "Finance", 14, 0.8, ["Gross, expenses and net raised", "Report to members"], ["Share how much we netted"], 0, ["Reconcile the ticket money"]),
    ],
    oneOffs: [{ title: "Rent a sound system", team: "Venue", day: -2 }, { title: "Add a silent auction", team: "Ways and means", day: -10 }],
  },
];
