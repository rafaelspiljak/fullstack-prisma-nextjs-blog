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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  return (
    <Layout>
      {isLoading ? (
        <div className="h-[100vh]">
          <svg
            aria-hidden="true"
            className="inline w-8 h-8 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-red-600"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
          <span className="sr-only">Loading...</span>
        </div>
      ) : (
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
                      <span>
                        {post.id.split(":00.000")[0].replace("T", " ")}
                      </span>
                      {!!session ? (
                        <>
                          {!post.reservedBy ? (
                            <button
                              className="m-2 p-2 bg-gray-600 rounded-lg text-white"
                              onClick={async () => {
                                setIsLoading(true);
                                try {
                                  await fetch(`/api/reserve-slot/`, {
                                    method: "POST",
                                    body: JSON.stringify({ id: post.id }),
                                  });
                                  toast.success("Rezervacija uspješna", {
                                    icon: "🎾",
                                  });
                                  setTimeout(() => {
                                    router.reload();
                                  }, 2000);
                                } catch (e) {
                                  toast.error("Pokušajte ponovno");
                                } finally {
                                  setIsLoading(false);
                                }
                              }}
                            >
                              Rezerviraj termin
                            </button>
                          ) : post.reservedBy?.id == session?.user?.id ? (
                            <button
                              className="m-2 p-2 bg-red-400 rounded-lg text-white"
                              onClick={async () => {
                                setIsLoading(true);

                                try {
                                  await fetch(`/api/reserve-slot/${post.id}`, {
                                    method: "DELETE",
                                  });
                                  toast.success(
                                    "Otkazivanje rezervacije uspješno",
                                    { icon: "🎾" }
                                  );

                                  setTimeout(() => {
                                    router.reload();
                                  }, 2000);
                                } catch (e) {
                                  toast.error("Pokušajte ponovno");
                                } finally {
                                  setIsLoading(false);
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
      )}
    </Layout>
  );
};

export default Blog;
