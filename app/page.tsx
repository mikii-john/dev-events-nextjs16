import ExploreBtn from "@/components/ExploreBtn";
import EventCard from "@/components/EventCard";

const Base_URL = process.env.NEXT_PUBLIC_BASE_URL;

const page = async () => {
  const responce = await fetch(`${Base_URL}/api/events`, { cache: 'no-store' });
  const data = await responce.json();
  const events = data?.events || [];



  return (
    <section >
    <h1 className="text-center">The Hub for Every Dev <br /> Event You Can't miss</h1>
    <p className="text-center mt-5"> Hackathons, Meetups , and conferences, All in one places </p>
    
    <ExploreBtn />

    <div className="mt-20 space-y-7">
      <h3>Featured Events</h3>

      <ul className="events">
        {events && events.length > 0 && events.map((event: IEvent )=>(
          <li key={event.title}><EventCard {...event} /></li>
          ))}
      </ul>
    </div>
    </section>
  )
}

export default page