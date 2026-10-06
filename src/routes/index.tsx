import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  HandHeart,
  HeartHandshake,
  Network,
  Plus,
  Send,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Favour Economy | What if friendship had a balance sheet?" },
      {
        name: "description",
        content: "See how favours move through Hostel Block B. A social reciprocity demo, with zero money involved.",
      },
      { property: "og:title", content: "Favour Economy | What if friendship had a balance sheet?" },
      {
        property: "og:description",
        content: "See how favours move through Hostel Block B. A social reciprocity demo, with zero money involved.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FavourEconomy,
});

type CommunityId = "hostel" | "studio";
type Direction = "given" | "received";
type Status = "confirmed" | "pending";

type Relationship = {
  name: string;
  given: number;
  received: number;
  accent: string;
  note: string;
};

type Favour = {
  id: string;
  person: string;
  title: string;
  direction: Direction;
  status: Status;
  time: string;
};

type CommunityData = {
  name: string;
  context: string;
  members: string[];
  total: number;
  relationships: Relationship[];
  favours: Favour[];
};

const seeds: Record<CommunityId, CommunityData> = {
  hostel: {
    name: "Hostel Block B",
    context: "Campus living, late nights, and lending your good charger.",
    members: ["Keshav", "Rahul", "Aditi", "Arjun", "Priya", "Rohan"],
    total: 147,
    relationships: [
      { name: "Rahul", given: 5, received: 0, accent: "bg-coral", note: "A premium subscription to your kindness." },
      { name: "Aditi", given: 3, received: 4, accent: "bg-teal", note: "A lovely little back-and-forth." },
      { name: "Arjun", given: 2, received: 2, accent: "bg-citrus", note: "Certified favour-for-favour energy." },
      { name: "Priya", given: 1, received: 3, accent: "bg-lilac", note: "Priya has been showing up for you." },
      { name: "Rohan", given: 2, received: 1, accent: "bg-teal", note: "Your next little favour could even things out." },
    ],
    favours: [
      { id: "h1", person: "Rahul", title: "Helped move a very full bookshelf", direction: "given", status: "confirmed", time: "Today, 12:40" },
      { id: "h2", person: "Aditi", title: "Debugged my code before class", direction: "received", status: "pending", time: "Today, 10:15" },
      { id: "h3", person: "Priya", title: "Covered your shift at the café", direction: "received", status: "confirmed", time: "Yesterday" },
      { id: "h4", person: "Rahul", title: "Lent a charger for the whole weekend", direction: "given", status: "confirmed", time: "Yesterday" },
      { id: "h5", person: "Arjun", title: "Sent over the lecture notes", direction: "given", status: "confirmed", time: "Monday" },
    ],
  },
  studio: {
    name: "Studio Circle",
    context: "A tiny creative crew that trades time, feedback, and great playlists.",
    members: ["Keshav", "Meera", "Dev", "Ira", "Neil", "Zoya"],
    total: 82,
    relationships: [
      { name: "Meera", given: 4, received: 2, accent: "bg-lilac", note: "Meera owes you a very good coffee run." },
      { name: "Dev", given: 1, received: 3, accent: "bg-teal", note: "Dev has been your studio day MVP." },
      { name: "Ira", given: 3, received: 3, accent: "bg-citrus", note: "Perfectly matched effort. Suspiciously wholesome." },
      { name: "Neil", given: 2, received: 1, accent: "bg-coral", note: "One small favour could even this up." },
      { name: "Zoya", given: 1, received: 2, accent: "bg-teal", note: "Zoya has been looking out for you." },
    ],
    favours: [
      { id: "s1", person: "Meera", title: "Helped hang the gallery prints", direction: "given", status: "confirmed", time: "Today, 14:20" },
      { id: "s2", person: "Dev", title: "Brought coffee before the review", direction: "received", status: "pending", time: "Today, 11:00" },
      { id: "s3", person: "Ira", title: "Gave thoughtful portfolio notes", direction: "received", status: "confirmed", time: "Yesterday" },
      { id: "s4", person: "Neil", title: "Picked up supplies on the way in", direction: "given", status: "confirmed", time: "Monday" },
      { id: "s5", person: "Zoya", title: "Shared her favorite project playlist", direction: "received", status: "confirmed", time: "Monday" },
    ],
  },
};

const palette = ["bg-coral", "bg-teal", "bg-citrus", "bg-lilac", "bg-teal", "bg-coral"];
const starterCards = [
  { title: "Helped move", person: "Rahul", given: true, className: "left-4 top-9", delay: "0s" },
  { title: "Sent notes", person: "Aditi", given: false, className: "right-3 top-8", delay: "1s" },
  { title: "Lent a charger", person: "Priya", given: true, className: "left-8 bottom-10", delay: "2s" },
  { title: "Covered your shift", person: "Arjun", given: false, className: "right-1 bottom-12", delay: "0.5s" },
];

function loadSaved<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function FavourEconomy() {
  const [activeView, setActiveView] = useState<"home" | "community">("home");
  const [communityId, setCommunityId] = useState<CommunityId>("hostel");
  const [communities, setCommunities] = useState<Record<CommunityId, CommunityData>>(seeds);
  const [ready, setReady] = useState(false);
  const [dialog, setDialog] = useState<"log" | "request" | "relationship" | null>(null);
  const [selectedPerson, setSelectedPerson] = useState("Rahul");
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [direction, setDirection] = useState<Direction>("given");
  const [favourTitle, setFavourTitle] = useState("");
  const [requestTitle, setRequestTitle] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const savedCommunity = loadSaved<CommunityId>("favour-economy-community", "hostel");
    const savedData = loadSaved<Record<CommunityId, CommunityData>>("favour-economy-data", seeds);
    setCommunityId(savedCommunity in seeds ? savedCommunity : "hostel");
    setCommunities(savedData);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem("favour-economy-community", JSON.stringify(communityId));
      window.localStorage.setItem("favour-economy-data", JSON.stringify(communities));
    } catch {
      setNotice("Your browser could not save this demo session.");
    }
  }, [communityId, communities, ready]);

  const community = communities[communityId];
  const netFavourCount = useMemo(
    () => community.relationships.reduce((total, person) => total + person.given - person.received, 0),
    [community.relationships],
  );
  const pendingCount = community.favours.filter((favour) => favour.status === "pending").length;

  const enterCommunity = () => {
    setActiveView("community");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const changeCommunity = (nextCommunity: CommunityId) => {
    setCommunityId(nextCommunity);
    setSelectedPerson(seeds[nextCommunity].relationships[0]?.name ?? "");
    setNotice(`You are now in ${seeds[nextCommunity].name}.`);
  };

  const showNotice = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 3600);
  };

  const logFavour = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = favourTitle.trim();
    if (!title || !selectedPerson) return;

    setCommunities((current) => {
      const active = current[communityId];
      const relationships = active.relationships.map((person) =>
        person.name === selectedPerson
          ? { ...person, [direction]: person[direction] + 1 }
          : person,
      );
      const newFavour: Favour = {
        id: `demo-${Date.now()}`,
        title,
        person: selectedPerson,
        direction,
        status: "pending",
        time: "Just now",
      };
      return {
        ...current,
        [communityId]: { ...active, total: active.total + 1, relationships, favours: [newFavour, ...active.favours] },
      };
    });
    setFavourTitle("");
    setDialog(null);
    showNotice(`Your favour for ${selectedPerson} is in the log.`);
  };

  const confirmFavour = (id: string) => {
    setCommunities((current) => ({
      ...current,
      [communityId]: {
        ...current[communityId],
        favours: current[communityId].favours.map((favour) =>
          favour.id === id ? { ...favour, status: "confirmed" } : favour,
        ),
      },
    }));
    showNotice("Favour confirmed. The balance just moved.");
  };

  const sendRequest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!requestTitle.trim()) return;
    const trimmed = requestTitle.trim();
    setRequestTitle("");
    setDialog(null);
    showNotice(`Request sent to ${selectedPerson}: ${trimmed}`);
  };

  const openRelationship = (relationship: Relationship) => {
    setSelectedRelationship(relationship);
    setSelectedPerson(relationship.name);
    setDialog("relationship");
  };

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      {activeView === "home" ? (
        <LandingPage onStart={enterCommunity} />
      ) : (
        <CommunityPage
          community={community}
          communityId={communityId}
          netFavourCount={netFavourCount}
          pendingCount={pendingCount}
          onBack={() => setActiveView("home")}
          onChangeCommunity={changeCommunity}
          onLog={() => setDialog("log")}
          onRequest={() => setDialog("request")}
          onRelationship={openRelationship}
          onConfirm={confirmFavour}
        />
      )}
      <DemoDialog
        dialog={dialog}
        community={community}
        selectedPerson={selectedPerson}
        selectedRelationship={selectedRelationship}
        direction={direction}
        favourTitle={favourTitle}
        requestTitle={requestTitle}
        onClose={() => setDialog(null)}
        onPersonChange={setSelectedPerson}
        onDirectionChange={setDirection}
        onFavourTitleChange={setFavourTitle}
        onRequestTitleChange={setRequestTitle}
        onLog={logFavour}
        onRequest={sendRequest}
        onLogForSelected={() => setDialog("log")}
        onRequestForSelected={() => setDialog("request")}
      />
      {notice && (
        <div role="status" className="fixed bottom-5 left-1/2 z-[60] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 border border-border bg-popover px-4 py-3 text-sm text-foreground shadow-2xl">
          <Check className="size-4 shrink-0 text-teal" aria-hidden="true" />
          <span>{notice}</span>
          <Button variant="ghost" size="icon" aria-label="Dismiss notification" onClick={() => setNotice("")}>
            <X />
          </Button>
        </div>
      )}
    </main>
  );
}

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-3 text-left" aria-label="Favour Economy home">
      <span className="grid size-9 place-items-center bg-primary font-display text-xl text-primary-foreground">F</span>
      <span className="font-display text-xl uppercase leading-none">Favour<span className="text-primary">.</span>Economy</span>
    </button>
  );
}

function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <div>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between px-5 md:px-8">
          <Brand />
          <nav className="hidden items-center gap-8 text-xs font-medium text-muted-foreground md:flex" aria-label="Page sections">
            <a className="transition-colors hover:text-foreground" href="#overview">Overview</a>
            <a className="transition-colors hover:text-foreground" href="#how">How it works</a>
            <a className="transition-colors hover:text-foreground" href="#insights">Insights</a>
          </nav>
          <Button onClick={onStart} className="h-10 rounded-full px-4 text-xs font-semibold">
            Open community <ArrowRight />
          </Button>
        </div>
      </header>

      <section id="overview" className="relative mx-auto grid min-h-[690px] max-w-[1240px] items-center gap-10 px-5 py-16 md:grid-cols-[1.05fr_.95fr] md:px-8 md:py-20">
        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 border border-border bg-panel px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <span className="size-2 rounded-full bg-teal" />
            Small acts, tracked simply
          </div>
          <h1 className="max-w-[9ch] font-display text-7xl uppercase leading-[0.79] text-balance md:text-9xl">
            Favour <span className="text-primary">Economy</span>
          </h1>
          <p className="mt-7 max-w-[14ch] text-3xl font-medium leading-tight text-foreground md:text-[2.65rem]">
            Keep the good things visible.
          </p>
          <p className="mt-4 max-w-[43ch] text-base leading-7 text-muted-foreground">
            A quick way to remember who helped, who showed up, and where the balance needs a little attention.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={onStart} className="h-12 rounded-full px-6 font-semibold">
              Open dashboard <ArrowRight />
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-full px-6 font-semibold">
              <a href="#how">See the flow <ArrowDown /></a>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap items-end gap-x-6 gap-y-4 border-t border-border pt-6">
            <div>
              <div className="font-display text-5xl">₹0</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.17em] text-muted-foreground">spent</div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div>
              <div className="font-display text-5xl text-teal">147</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.17em] text-muted-foreground">favors logged</div>
            </div>
            <div className="ml-auto hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
              <UsersRound className="size-4 text-coral" />
              6 people in the room
            </div>
          </div>
        </div>

        <div className="relative mx-auto h-[440px] w-full max-w-[530px] md:h-[480px]" aria-label="A preview of favours exchanged between friends">
          <div className="absolute left-1/2 top-1/2 size-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal/15 md:size-[310px]" />
          <div className="absolute left-1/2 top-1/2 size-[345px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/70 md:size-[420px]" />
          <div className="absolute left-1/2 top-1/2 size-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-coral/40 bg-coral/15" />
          <div className="favour-ring absolute left-1/2 top-1/2 size-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-coral/40" />
          <div className="absolute left-1/2 top-1/2 z-10 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-foreground font-display text-xl text-background">YOU</div>
          {starterCards.map((card, index) => (
            <div key={card.title} className={`favour-float absolute z-20 w-[min(45vw,218px)] border border-border bg-card p-3.5 shadow-xl ${card.className}`} style={{ animationDelay: card.delay }}>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{card.given ? "You gave" : "You received"}</span>
              <div className="mt-1 font-display text-xl leading-tight">{card.title}</div>
              <div className={`mt-2 font-mono text-[10px] ${index % 2 ? "text-teal" : "text-coral"}`}>
                {card.given ? `Keshav → ${card.person}` : `${card.person} → Keshav`}
              </div>
            </div>
          ))}
          {[
            { name: "K", className: "left-1/2 top-1 -translate-x-1/2" },
            { name: "R", className: "right-2 top-[28%]" },
            { name: "A", className: "right-8 bottom-6" },
            { name: "P", className: "left-1/2 bottom-1 -translate-x-1/2" },
            { name: "Ar", className: "left-2 bottom-8" },
            { name: "Ro", className: "left-0 top-[27%]" },
          ].map((person, index) => (
            <span key={`${person.name}-${index}`} className={`absolute z-10 grid size-10 place-items-center rounded-full border-2 border-background font-display text-sm text-background ${palette[index]} ${person.className}`}>{person.name}</span>
          ))}
        </div>
      </section>

      <section id="problem" className="border-y border-border bg-panel/50">
        <div className="mx-auto max-w-[1240px] px-5 py-16 md:px-8 md:py-20">
          <div className="grid gap-3 md:grid-cols-[1fr_.75fr] md:items-end">
            <h2 className="max-w-[13ch] font-display text-5xl uppercase leading-none md:text-6xl">Why it matters</h2>
            <p className="max-w-[38ch] pb-1 text-sm leading-6 text-muted-foreground">Small acts are easy to forget until the balance feels off.</p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["A ride home", "One good turn becomes a habit."],
              ["A favour to move", "Good things blur together if no one tracks them."],
              ["A charger loan", "People keep helping, sometimes quietly."],
              ["A kind nudge", "The balance is clearer once it is visible."],
            ].map(([title, copy]) => (
              <div key={title} className="border border-border bg-background p-5">
                <p className="font-display text-2xl uppercase leading-none text-coral">{title}</p>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-[1240px] px-5 py-16 md:px-8 md:py-20">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-4xl uppercase md:text-5xl">Fast and clear</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.17em] text-muted-foreground">Three steps</span>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { number: "01", title: "Log", description: "Add the little thing that mattered.", icon: HandHeart, color: "text-coral" },
            { number: "02", title: "Track", description: "See who is giving and receiving more.", icon: HeartHandshake, color: "text-teal" },
            { number: "03", title: "Balance", description: "Spot the patterns before they get awkward.", icon: Network, color: "text-citrus" },
          ].map(({ number, title, description, icon: Icon, color }) => (
            <div key={number} className="border-t border-border py-6">
              <div className="flex items-center justify-between">
                <span className={`font-display text-5xl ${color}`}>{number}</span>
                <Icon className={`size-6 ${color}`} aria-hidden="true" />
              </div>
              <h3 className="mt-5 font-display text-3xl uppercase">{title}</h3>
              <p className="mt-2 max-w-[35ch] text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="insights" className="border-y border-border bg-panel/50">
        <div className="mx-auto max-w-[1240px] px-5 py-16 md:px-8 md:py-20">
          <div className="mb-8 flex items-end justify-between gap-3">
            <h2 className="font-display text-4xl uppercase md:text-5xl">What you notice</h2>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.17em] text-muted-foreground sm:block">At a glance</span>
          </div>
          <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Favour history", description: "Keep a record of the moments people actually show up.", icon: HandHeart, color: "text-coral" },
              { title: "Reciprocity", description: "See who is giving more than they are receiving.", icon: HeartHandshake, color: "text-teal" },
              { title: "Quick asks", description: "Send a small request without the awkwardness.", icon: Send, color: "text-citrus" },
              { title: "Community view", description: "Check the whole rhythm of your group in one screen.", icon: Network, color: "text-lilac" },
            ].map(({ title, description, icon: Icon, color }) => (
              <div key={title} className="min-h-[206px] bg-background p-5">
                <Icon className={`size-5 ${color}`} aria-hidden="true" />
                <h3 className="mt-9 font-display text-2xl uppercase">{title}</h3>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-5 px-5 py-9 sm:flex-row sm:items-center md:px-8">
        <Brand />
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Kindness, visible.</div>
        <Button onClick={onStart} variant="outline" className="rounded-full">
          Open community <ArrowRight />
        </Button>
      </footer>
    </div>
  );
}

function CommunityPage({
  community,
  communityId,
  netFavourCount,
  pendingCount,
  onBack,
  onChangeCommunity,
  onLog,
  onRequest,
  onRelationship,
  onConfirm,
}: {
  community: CommunityData;
  communityId: CommunityId;
  netFavourCount: number;
  pendingCount: number;
  onBack: () => void;
  onChangeCommunity: (id: CommunityId) => void;
  onLog: () => void;
  onRequest: () => void;
  onRelationship: (relationship: Relationship) => void;
  onConfirm: (id: string) => void;
}) {
  const leadingRelationship = [...community.relationships].sort((a, b) => b.given - b.received - (a.given - a.received))[0];
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[68px] max-w-[1240px] items-center justify-between gap-4 px-5 md:px-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to Favour Economy intro"><ArrowLeft /></Button>
            <Brand onClick={onBack} />
          </div>
          <div className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:flex">
            <span className="size-2 rounded-full bg-teal" />
            Demo community
          </div>
          <Button onClick={onLog} className="h-10 rounded-full px-4 text-xs font-semibold">
            <Plus /> Log a favour
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-[1240px] px-5 py-8 md:px-8 md:py-12">
        <div className="flex flex-col justify-between gap-5 border-b border-border pb-7 md:flex-row md:items-end">
          <div>
            <label htmlFor="community-picker" className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Your little corner of the world</label>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="relative">
                <select
                  id="community-picker"
                  aria-label="Choose community"
                  value={communityId}
                  onChange={(event) => onChangeCommunity(event.target.value as CommunityId)}
                  className="max-w-[min(75vw,500px)] appearance-none bg-transparent pr-10 font-display text-4xl uppercase leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-5xl"
                >
                  <option value="hostel">Hostel Block B</option>
                  <option value="studio">Studio Circle</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-1 top-1/2 size-5 -translate-y-1/2 text-primary" />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <UsersRound className="size-4 text-teal" /> {community.members.length} people
              </div>
            </div>
            <p className="mt-2 max-w-[58ch] text-sm text-muted-foreground">{community.context}</p>
          </div>
          <Button onClick={onRequest} variant="outline" className="w-fit rounded-full">
            <Send /> Ask for a favour
          </Button>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
          <section className="border border-border bg-card p-5 md:p-7" aria-labelledby="economy-title">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <div id="economy-title" className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Your favour balance</div>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className={`font-display text-6xl ${netFavourCount > 0 ? "text-coral" : "text-teal"}`}>{netFavourCount > 0 ? `+${netFavourCount}` : netFavourCount}</span>
                  <span className="text-sm text-muted-foreground">{netFavourCount >= 0 ? "favours given" : "favours received"}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Money exchanged</div>
                <div className="mt-1 font-display text-4xl text-teal">₹0</div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-border py-3 text-xs">
              <span className="text-muted-foreground"><span className="font-mono font-semibold text-foreground">{community.total}</span> favours in this community</span>
              <span className="text-muted-foreground"><span className="font-mono font-semibold text-foreground">{community.members.length}</span> people showing up</span>
              <span className="text-muted-foreground"><span className="font-mono font-semibold text-foreground">{pendingCount}</span> waiting for a nod</span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <h2 className="font-display text-2xl uppercase">People who make your days easier</h2>
              <CircleHelp className="size-4 text-muted-foreground" aria-label="Select a person to see your relationship" />
            </div>
            <div className="mt-3 divide-y divide-border">
              {community.relationships.map((relationship) => {
                const surplus = relationship.given - relationship.received;
                return (
                  <button
                    key={relationship.name}
                    type="button"
                    onClick={() => onRelationship(relationship)}
                    className="group flex w-full flex-wrap items-center gap-3 py-3 text-left transition-colors hover:bg-secondary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Open ${relationship.name}'s relationship. ${relationship.given} given, ${relationship.received} received.`}
                  >
                    <span className={`grid size-10 shrink-0 place-items-center rounded-full font-display text-base text-background ${relationship.accent}`}>{relationship.name.slice(0, 1)}</span>
                    <span className="min-w-[74px] flex-1 font-medium">{relationship.name}</span>
                    <span className="min-w-[138px] text-right font-mono text-[10px] text-muted-foreground sm:min-w-[174px] sm:text-xs">
                      <span className={surplus > 0 ? "text-coral" : "text-foreground"}>{relationship.given} given</span>
                      <span className="mx-1.5 text-border">/</span>
                      <span className={surplus < 0 ? "text-teal" : "text-foreground"}>{relationship.received} received</span>
                    </span>
                    <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-secondary sm:block" aria-hidden="true">
                      <span className={`block h-full rounded-full ${surplus > 0 ? "bg-coral" : "bg-teal"}`} style={{ width: `${Math.min(100, Math.max(15, (Math.max(relationship.given, relationship.received) / Math.max(1, relationship.given + relationship.received)) * 100))}%` }} />
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </section>

          <section className="flex flex-col gap-5">
            <CommunityNetwork community={community} onRelationship={onRelationship} />
            {leadingRelationship && leadingRelationship.given > leadingRelationship.received && (
              <div className="border border-primary/25 bg-primary/10 p-5">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                  <Sparkles className="size-4" /> A gentle little observation
                </div>
                <p className="mt-3 text-sm leading-6 text-foreground">
                  <strong>{leadingRelationship.name}</strong> is currently enjoying a premium subscription to your kindness. Maybe ask them for a favour?
                </p>
                <Button onClick={() => onRelationship(leadingRelationship)} variant="outline" className="mt-4 rounded-full border-primary/35">
                  See your story <ArrowRight />
                </Button>
              </div>
            )}
          </section>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[.78fr_1.22fr]">
          <section className="border border-border bg-card p-5 md:p-6" aria-labelledby="community-members-title">
            <div className="flex items-center justify-between gap-3">
              <h2 id="community-members-title" className="font-display text-2xl uppercase">The whole crew</h2>
              <span className="font-mono text-[10px] text-muted-foreground">{community.members.length} in the mix</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
              {community.members.map((member, index) => (
                <button
                  key={member}
                  type="button"
                  onClick={() => {
                    const relationship = community.relationships.find((entry) => entry.name === member);
                    if (relationship) onRelationship(relationship);
                  }}
                  className="flex min-w-0 items-center gap-2 text-left transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={member === community.members[0] ? `${member}, that is you` : `Open ${member}'s relationship`}
                >
                  <span className={`grid size-8 shrink-0 place-items-center rounded-full font-display text-xs text-background ${palette[index]}`}>{member.slice(0, 1)}</span>
                  <span className="truncate text-xs font-medium">{member}{index === 0 ? " (you)" : ""}</span>
                </button>
              ))}
            </div>
            <p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">No one here is a customer. You are just friends showing up for each other.</p>
          </section>

          <section className="border border-border bg-card p-5 md:p-6" aria-labelledby="favour-log-title">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 id="favour-log-title" className="font-display text-2xl uppercase">Fresh from the group chat</h2>
                <p className="mt-1 text-xs text-muted-foreground">Little things worth remembering</p>
              </div>
              <Button onClick={onLog} variant="outline" size="icon" aria-label="Log a new favour"><Plus /></Button>
            </div>
            <div className="mt-4 divide-y divide-border">
              {community.favours.slice(0, 5).map((favour) => (
                <div key={favour.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className={`size-2 shrink-0 rounded-full ${favour.direction === "given" ? "bg-coral" : "bg-teal"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm leading-5">
                      {favour.direction === "given" ? <>You helped <strong>{favour.person}</strong></> : <><strong>{favour.person}</strong> helped you</>}
                      <span className="text-muted-foreground"> with {favour.title}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground">
                      <Clock3 className="size-3" />{favour.time}<span aria-hidden="true">/</span>
                      <span className={favour.status === "confirmed" ? "text-teal" : "text-citrus"}>{favour.status}</span>
                    </div>
                  </div>
                  {favour.status === "pending" && (
                    <Button onClick={() => onConfirm(favour.id)} variant="outline" size="sm" className="rounded-full border-teal/35 px-3 text-xs text-teal hover:bg-teal/10 hover:text-teal">
                      <Check /> Confirm
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border py-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <span>₹0 exchanged. {community.total} favours remembered.</span>
          <Button onClick={onBack} variant="ghost" size="sm" className="text-muted-foreground"><ArrowLeft /> Back to the beginning</Button>
        </footer>
      </div>
    </div>
  );
}

function CommunityNetwork({ community, onRelationship }: { community: CommunityData; onRelationship: (relationship: Relationship) => void }) {
  const positions = ["left-1/2 top-[6%] -translate-x-1/2", "right-[2%] top-[30%]", "right-[11%] bottom-[2%]", "left-[37%] bottom-0", "left-2 bottom-[14%]"];

  return (
    <section className="border border-border bg-card p-5 md:p-6" aria-labelledby="network-title">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="network-title" className="font-display text-2xl uppercase">Favour network</h2>
          <p className="mt-1 text-xs text-muted-foreground">One block. A lot of showing up.</p>
        </div>
        <Network className="size-5 text-teal" aria-hidden="true" />
      </div>

      <div className="relative mt-4 h-[225px] overflow-hidden border-t border-border pt-3" aria-label={`A network of six friends in ${community.name}`}>
        <svg className="absolute inset-0 h-full w-full text-border" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <circle cx="50" cy="51" r="29" fill="none" stroke="currentColor" strokeDasharray="2 2" strokeWidth=".6" />
          <path d="M50 51 L50 9 M50 51 L89 31 M50 51 L80 84 M50 51 L43 90 M50 51 L11 75 M50 51 L10 31" fill="none" stroke="currentColor" strokeWidth=".6" />
        </svg>
        <span className="favour-ring absolute left-1/2 top-[51%] size-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/30" />
        <span className="absolute left-1/2 top-[51%] z-10 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-background bg-primary font-display text-xs text-primary-foreground">YOU</span>
        {community.members.slice(1).map((member, index) => (
          <button
            key={member}
            type="button"
            onClick={() => {
              const relationship = community.relationships.find((entry) => entry.name === member);
              if (relationship) onRelationship(relationship);
            }}
            aria-label={`Open ${member}'s relationship`}
            className={`absolute z-10 grid size-9 place-items-center rounded-full border-2 border-background font-display text-xs text-background ${palette[index + 1]} ${positions[index]}`}
          >
            {member.slice(0, 2)}
          </button>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-border pt-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-coral" /> You helped them</span>
        <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-teal" /> They helped you</span>
      </div>
    </section>
  );
}

function DemoDialog({
  dialog,
  community,
  selectedPerson,
  selectedRelationship,
  direction,
  favourTitle,
  requestTitle,
  onClose,
  onPersonChange,
  onDirectionChange,
  onFavourTitleChange,
  onRequestTitleChange,
  onLog,
  onRequest,
  onLogForSelected,
  onRequestForSelected,
}: {
  dialog: "log" | "request" | "relationship" | null;
  community: CommunityData;
  selectedPerson: string;
  selectedRelationship: Relationship | null;
  direction: Direction;
  favourTitle: string;
  requestTitle: string;
  onClose: () => void;
  onPersonChange: (person: string) => void;
  onDirectionChange: (direction: Direction) => void;
  onFavourTitleChange: (title: string) => void;
  onRequestTitleChange: (title: string) => void;
  onLog: (event: FormEvent<HTMLFormElement>) => void;
  onRequest: (event: FormEvent<HTMLFormElement>) => void;
  onLogForSelected: () => void;
  onRequestForSelected: () => void;
}) {
  const otherMembers = community.members.slice(1);

  return (
    <Dialog open={dialog !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[min(88vh,760px)] max-w-md overflow-y-auto border-border bg-popover p-6 text-popover-foreground">
        {dialog === "log" && (
          <form onSubmit={onLog}>
            <DialogHeader>
              <DialogTitle className="font-display text-3xl uppercase">Put it on the board</DialogTitle>
              <DialogDescription>Just the moment. No price tag required.</DialogDescription>
            </DialogHeader>

            <fieldset className="mt-5">
              <legend className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">What happened?</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {([
                  ["given", "I helped them"],
                  ["received", "They helped me"],
                ] as const).map(([value, label]) => (
                  <Button key={value} type="button" variant={direction === value ? "default" : "outline"} onClick={() => onDirectionChange(value)} className="rounded-full px-3 text-xs">
                    {label}
                  </Button>
                ))}
              </div>
            </fieldset>

            <label className="mt-5 block font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground" htmlFor="log-title">
              The favour
            </label>
            <input
              id="log-title"
              autoFocus
              required
              maxLength={100}
              placeholder="Helped carry a sofa up four floors"
              value={favourTitle}
              onChange={(event) => onFavourTitleChange(event.target.value)}
              className="mt-2 h-11 w-full border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />

            <label className="mt-4 block font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground" htmlFor="log-person">
              Your person
            </label>
            <select
              id="log-person"
              value={selectedPerson}
              onChange={(event) => onPersonChange(event.target.value)}
              className="mt-2 h-11 w-full border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {otherMembers.map((person) => (
                <option key={person} value={person}>{person}</option>
              ))}
            </select>

            <DialogFooter className="mt-6">
              <Button type="submit" className="w-full rounded-full">Add to the favour log <ArrowRight /></Button>
            </DialogFooter>
          </form>
        )}

        {dialog === "request" && (
          <form onSubmit={onRequest}>
            <DialogHeader>
              <DialogTitle className="font-display text-3xl uppercase">Ask your people</DialogTitle>
              <DialogDescription>Good friendships make room for asking, too.</DialogDescription>
            </DialogHeader>

            <label className="mt-5 block font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground" htmlFor="request-person">
              Ask someone
            </label>
            <select
              id="request-person"
              value={selectedPerson}
              onChange={(event) => onPersonChange(event.target.value)}
              className="mt-2 h-11 w-full border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {otherMembers.map((person) => (
                <option key={person} value={person}>{person}</option>
              ))}
            </select>

            <label className="mt-4 block font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground" htmlFor="request-title">
              What would help?
            </label>
            <textarea
              id="request-title"
              required
              maxLength={160}
              rows={3}
              placeholder="Could use a hand getting to the station tomorrow."
              value={requestTitle}
              onChange={(event) => onRequestTitleChange(event.target.value)}
              className="mt-2 w-full resize-y border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />

            <DialogFooter className="mt-6">
              <Button type="submit" className="w-full rounded-full">Send the ask <Send /></Button>
            </DialogFooter>
          </form>
        )}

        {dialog === "relationship" && selectedRelationship && (
          <div>
            <DialogHeader>
              <div className="mb-2 flex items-center gap-3">
                <span className={`grid size-12 place-items-center rounded-full font-display text-xl text-background ${selectedRelationship.accent}`}>{selectedRelationship.name.slice(0, 1)}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Your friendship, as remembered</span>
              </div>
              <DialogTitle className="font-display text-4xl uppercase">You &amp; {selectedRelationship.name}</DialogTitle>
              <DialogDescription>{selectedRelationship.note}</DialogDescription>
            </DialogHeader>

            <div className="mt-5 grid grid-cols-2 gap-px border border-border bg-border">
              <div className="bg-background p-4">
                <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">You gave</div>
                <div className="mt-1 font-display text-4xl text-coral">{selectedRelationship.given}</div>
              </div>
              <div className="bg-background p-4">
                <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">They gave</div>
                <div className="mt-1 font-display text-4xl text-teal">{selectedRelationship.received}</div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button onClick={onRequestForSelected} variant="outline" className="rounded-full text-xs"><Send /> Ask for a favour</Button>
              <Button onClick={onLogForSelected} className="rounded-full text-xs"><Plus /> Log a favour</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}