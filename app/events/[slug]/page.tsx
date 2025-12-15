import BookEvent from "@/components/BookEvent";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getSimilarEventsBySlug } from "@/lib/actions/event.actions";
import { IEvent } from "@/database/event.model";
import EventCard from "@/components/EventCard";


const Base_URL = process.env.NEXT_PUBLIC_BASE_URL;  

const EventDetailItem =({icon, alt, label}: {icon: string, alt: string, label: string}) => (
  <div className="flex-row-gap-2 items-center">
    <Image src={icon} alt={alt} width={17} height={17} />
    <p>{label}</p>
  </div>
)


const EventAgenda = ({agendaItems}: {agendaItems: string[]}
) => (
  <div className="agenda">
    <h2>Agenda</h2>
    <ul>
      {agendaItems.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  </div>
)

const EventTags = ({tags}: {tags: string[]}) => (
  <div className="flex flex-row gap-1.5 flex-wrap">
      {tags.map((tag) => (
        <div className="pill" key={tag}>{tag}</div>
      ))}
    </div>
)


const EventDetailsPage = async ({params}: {params: Promise<{slug: string}>}) => {
  const {slug} = await params;
  const request = await fetch(`${Base_URL}/api/events/${slug}`);
  
  if (!request.ok) return notFound();

  const data = await request.json();
  if (!data?.event) return notFound();

  const {event: {description, image,overview, title, location, date, time, mode, agenda, audience,tags, organizer}} = data;



  if (!description) return notFound();

const booking = 10;

const similarEvents : IEvent[] = await getSimilarEventsBySlug(slug);

console.log(similarEvents);

  return (
    <section id="event">
      <div>
         <h1>Event Descrption</h1>
         <p>{description}</p>
      </div>
      <div className="details">
       {/* {Left side -Event content} */}
       <div className="content">
          <Image src={image} alt="Event Banner" width={800} height={800} className="banner" />
       

       <section className="flex-col-gap-2">
        <h2>Overview</h2>
        <p>{overview}</p>
       </section>

       <section className="flex-col-gap-2">
        <h2>Event Details</h2>
        <EventDetailItem icon="/icons/calendar.svg" alt="calander" label={date} />
        <EventDetailItem icon="/icons/clock.svg" alt="clock" label={time} />
        <EventDetailItem icon="/icons/pin.svg" alt="location" label={location} />
        <EventDetailItem icon="/icons/mode.svg" alt="mode" label={mode} />
        <EventDetailItem   icon="/icons/audience.svg" alt="audiance" label={audience} />
       </section>

       <EventAgenda agendaItems={agenda}/>

       <section className="flex-col-gap-2">
        <h2>About the Organizer</h2>
        <p>{organizer}</p>
       </section>

       <EventTags tags={tags} />
       </div>
        
       {/* {Right side -Booking form} */}
       <aside className="booking">
        <div className="sighnup-card">
          <h2>Book Your Spot</h2>
          {booking > 0 ? (
            <p className="text-sm">Join {booking} people who have already booked their spot!</p>
          ) : (
            <p className="text-sm">Be the first to book your spot!</p>
          )}

          <BookEvent />
        </div>
       </aside>
      </div>

      <div className="flex w-full flex-col gap-4 pt-20">
        <h2>Similar Events</h2>
        <div className="events">
          {similarEvents.length > 0 && similarEvents.map((similarEvent:IEvent) => (
            <EventCard key={similarEvent.title} {...similarEvent} />
          ))}

        </div>
      </div>

    </section>
  )
}

export default EventDetailsPage