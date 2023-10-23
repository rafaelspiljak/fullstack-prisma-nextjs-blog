import React, { useState } from "react";
import type { GetStaticProps } from "next";
import Layout from "../components/Layout";
import prisma from "../lib/prisma";
import { useSession } from "next-auth/react";
import moment from "moment-timezone";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

export const getStaticProps: GetStaticProps = async (req) => {
  const today = new Date();
  today.setHours(today.getHours() - 1);
  const slots = await prisma.reservedSlot.findMany({
    where: {
      reservedAt: { gte: today },
    },
    include: {
      reservedBy: true,
    },
  });

  // Get the current time
  const userTimeZone = "Europe/Zagreb";

  // Get the current time in the user's time zone
  const currentTime = moment.tz(userTimeZone);
  // Set minutes and seconds to 0 for the current time
  currentTime.minutes(0);
  currentTime.seconds(0);
  currentTime.milliseconds(0);

  // Get the time 7 days from now
  const endTime = moment().add(7, "days");

  // Create an object to store the time slots grouped by day
  const timeSlotsByDay = {};

  // Generate 1-hour time slots from now to 7 days from now, set minutes and seconds to 0, and group them by day
  while (currentTime.isBefore(endTime)) {
    const startTime = currentTime.clone();
    const endTime = currentTime.clone().add(1, "hour");

    // Set minutes and seconds to 0 for start and end times
    startTime.minutes(0);
    startTime.seconds(0);
    endTime.minutes(0);
    endTime.seconds(0);

    // Check if the time slot is between 6 AM and midnight
    if (startTime.hours() < 2 || startTime.hours() >= 9) {
      const saveDate = startTime.toISOString().split("T")[0];

      // If the day is not in the object, create an array for it
      if (!timeSlotsByDay[saveDate]) {
        timeSlotsByDay[saveDate] = [];
      }

      // Push the time slot to the array for that day
      const foundIndex = slots.findIndex(
        (slot) => slot.id === startTime.toISOString(false)
      );

      if (foundIndex >= 0) {
        const slot = slots[foundIndex];
        timeSlotsByDay[saveDate].push({
          id: slot.id,
          reservedBy: {
            id: slot.reservedBy.id,
            firstName: slot.reservedBy.firstName,
            lastName: slot.reservedBy.lastName,
            phoneNumber: slot.reservedBy.phoneNumber,
          },
        });
      } else {
        timeSlotsByDay[saveDate].push({
          id: startTime.toISOString(false),
        });
      }
    }

    currentTime.add(1, "hour");
  }

  // Now, 'timeSlotsByDay' contains an object with time slots grouped by day, excluding the time slots between midnight and 6 AM

  return {
    props: { timeSlotsByDay },
    revalidate: 10,
  };
};

type Props = {
  dates: {
    id: string;
    reservedBy?: {
      id: string;
      phoneNumber: string;
    };
  }[];
  timeSlotsByDay: {
    [key: string]: {
      id: string;
      reservedBy?: {
        id: string;
        phoneNumber: string;
      };
    }[];
  };
};

const Blog: React.FC<Props> = (props) => {
  const {
    data: session,
    status,
  }: {
    status: string;
    data: {
      user: {
        phoneNumber: string;
        firstName: string;
        lastName: string;
        id: string;
        name?: string;
        email?: string;
        image?: string;
      };
    };
  } = useSession();

  const now = new Date();

  const [selectedDateIndex, setSelectedDateIndex] = useState<string | null>(
    null
  );
  const selectedDay = "border-b-2 border-b-green-600";
  const router = useRouter();
  return (
    <Layout>
      <div className="page">
        <main>
          <div className="bg-gray-400 p-2 m-2 rounded-lg grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
            {Object.keys(props.timeSlotsByDay).map((dayIndex, index) => {
              return (
                <div
                  key={dayIndex}
                  onClick={() => {
                    setSelectedDateIndex(dayIndex);
                  }}
                  className={`${
                    (selectedDateIndex === null && index === 0) ||
                    selectedDateIndex === dayIndex
                      ? selectedDay
                      : ""
                  } cursor-pointer `}
                >
                  {dayIndex}
                </div>
              );
            })}
          </div>
          <div className="bg-gray-500 p-2 rounded-lg m-2">
            {Object.keys(props.timeSlotsByDay).map((dayIndex, index) => {
              if (
                (index === 0 && selectedDateIndex === null) ||
                selectedDateIndex === dayIndex
              ) {
                return props.timeSlotsByDay[dayIndex].map((post) => (
                  <div key={post.id} className="gap-2 flex items-center my-2">
                    <span>{post.id.split(":00.000")[0].replace("T", " ")}</span>
                    {!!session ? (
                      <>
                        {!post.reservedBy ? (
                          <button
                            className="m-2 p-2 bg-gray-600 rounded-lg text-white"
                            onClick={async () => {
                              try {
                                await fetch(`/api/reserve-slot/`, {
                                  method: "POST",
                                  body: JSON.stringify({ id: post.id }),
                                });
                                toast.success("Rezervacija uspješna");
                                setTimeout(() => {
                                  router.reload();
                                }, 1000);
                              } catch (e) {
                                toast.error("Pokušajte ponovno");
                              }
                            }}
                          >
                            Rezerviraj termin
                          </button>
                        ) : post.reservedBy?.id == session?.user?.id ? (
                          <button
                            className="m-2 p-2 bg-red-400 rounded-lg text-white"
                            onClick={async () => {
                              try {
                                await fetch(`/api/reserve-slot/${post.id}`, {
                                  method: "DELETE",
                                });
                                toast.success(
                                  "Otkazivanje rezervacije uspješno"
                                );

                                setTimeout(() => {
                                  router.reload();
                                }, 1000);
                              } catch (e) {
                                toast.error("Pokušajte ponovno");
                              }
                            }}
                          >
                            Otkaži rezervaciju
                          </button>
                        ) : null}
                      </>
                    ) : !!post.reservedBy ? (
                      <span>Rezervirano</span>
                    ) : (
                      <span>Slobodan termin</span>
                    )}
                  </div>
                ));
              }

              return null;
            })}
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default Blog;
