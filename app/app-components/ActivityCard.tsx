"use client";

import AnimatedItem from "./AnimatedList";
import { Dialog } from "frosted-ui";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import styles from "./ActivityCard.module.css";

interface Activity {
  id: string;
  thumbnail: string;
  title: string;
  description: string;
  user?: string;
  sharedNote?: boolean;
  sharedPhoto?: boolean;
  timestamp: any;
}

interface ActivityCardProps {
  activity: Activity;
  index: number;
  isPublicView?: boolean;
}

const ActivityCard = ({ activity, index, isPublicView = false }: ActivityCardProps) => {
  const showDescription = activity.description && (!isPublicView || activity.sharedNote);
  const showThumbnail = activity.thumbnail && (!isPublicView || activity.sharedPhoto);

  return (
    <AnimatedItem index={index}>
      <div key={activity.id} className={styles.activityCard}>
        <div className={styles.content}>
          <h3 className={styles.cardTitle}>
            {activity.user ? `${activity.user}'s ${activity.title}` : activity.title}
          </h3>
          {showDescription && (
            <p className={styles.cardDescription}>{activity.description}</p>
          )}
        </div>
        {showThumbnail && (
          <Dialog.Root>
            <Dialog.Trigger>
              <img
                src={activity.thumbnail}
                alt={activity.title}
                className={`${styles.thumbnail} ${styles.rightAlign}`}
                style={{ cursor: "pointer" }}
              />
            </Dialog.Trigger>
            <Dialog.Content className={styles.dialogContent}>
              {/* Accessible title for screen readers (visually hidden) */}
              <VisuallyHidden>
                <Dialog.Title>{activity.title}</Dialog.Title>
              </VisuallyHidden>
              <div className={styles.imageContainer}>
                <img src={activity.thumbnail} alt={activity.title} className={styles.fullImage} />
              </div>
            </Dialog.Content>
          </Dialog.Root>
        )}
      </div>
    </AnimatedItem>
  );
};

export default ActivityCard;
