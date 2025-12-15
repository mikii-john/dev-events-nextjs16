import Link from "next/link";
import Image from "next/image";

interface Props {
    title: string;
    image: string;
    slug: string;
    date: string;
    location: string;
    description: string;
    time: string;
    mode: string;
    audience: string;
}

const EventCard = ({ title, image, slug, location, date, time, mode, audience }: Props) => {
  return (
    <Link href={`/events/${slug}`} id="event-card" className="block">
        <div className="relative">
            <Image src={image} alt={title} width={410} height={300} className="poster rounded-lg object-cover" />
        </div>

        <div className="flex flex-row gap-2 mt-3 items-center">
            <Image src="/icons/pin.svg" alt="location" width={24} height={24}/>
            <p className="text-sm text-gray-700">{location}</p>
        </div>
        <p className="title text-lg font-bold mt-2">{title}</p>
        <div className="flex flex-row justify-between items-center mt-3">
            <div className="flex flex-row gap-2 items-center">
                <Image src="/icons/calendar.svg" alt="date" width={14} height={14}/>
                <p className="text-sm text-gray-500">{date}</p>
            </div>
             <div className="flex flex-row gap-2 items-center">
                <Image src="/icons/clock.svg" alt="time" width={14} height={14}/>
                <p className="text-sm text-gray-500">{time}</p>
            </div>    
        </div>
    </Link>
  )
}

export default EventCard