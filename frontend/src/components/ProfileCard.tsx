import React from "react";
import "./ProfileCard.css";
import { useUserProfile } from "../hooks/useUserProfile";
import { useAuth } from "../hooks/useAuth";

interface ProfileCardProps {
  avatarUrl: string;
  name?: string;
  title?: string;
  handle?: string;
  status?: string;
  contactText?: string;
  showUserInfo?: boolean;
  onContactClick?: () => void;
}

const ProfileCardComponent: React.FC<ProfileCardProps> = ({
  avatarUrl = "",
  name = "User",
  title = "Member",
  handle = "user",
  status = "Online",
  contactText = "Contact",
  showUserInfo = true,
  onContactClick,
}) => {
  // Get real user profile data
  const { profile, loading: profileLoading } = useUserProfile();
  const { isAuthenticated } = useAuth();

  // Use real data if available, otherwise use props
  const displayName = profile?.user?.username || name;
  const displayTitle = profile?.user?.reputationLevel || title;
  const displayHandle = profile?.user?.walletAddress
    ? `${profile.user.walletAddress.slice(0, 6)}...${profile.user.walletAddress.slice(-4)}`
    : handle;
  const displayStatus = isAuthenticated ? "Online" : "Offline";
  
  // Create a fallback avatar if no valid avatar URL is provided
  const fallbackAvatar = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"><rect width="400" height="600" fill="#f0b90b"/><text x="200" y="320" font-family="Arial, sans-serif" font-size="120" fill="#1a1a1b" text-anchor="middle" font-weight="bold">U</text></svg>')}`;
  
  const displayAvatar = profile?.user?.avatarUrl || avatarUrl || fallbackAvatar;
  const displayMiniAvatar = profile?.user?.avatarUrl || avatarUrl || fallbackAvatar;

  const handleContactClick = () => {
    onContactClick?.();
  };

  // Show loading state if profile is being fetched
  if (profileLoading && isAuthenticated) {
    return (
      <div className="pc-card-wrapper">
        <div className="pc-card">
          <div className="pc-inside">
            <div className="pc-content">
              <div className="pc-details">
                <h3>Loading...</h3>
                <p>Fetching profile data</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pc-card-wrapper">
      <div className="pc-card">
        <div className="pc-inside">
          <div className="pc-content pc-avatar-content">
            <img
              className="avatar"
              src={displayAvatar}
              alt={`${displayName || "User"} avatar`}
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                console.warn("Avatar image failed to load:", displayAvatar);
              }}
            />
          </div>
          
          <div className="pc-content">
            <div className="pc-details">
              <h3>{displayName}</h3>
              <p>{displayTitle}</p>
              {profile?.statistics && (
                <div className="pc-stats">
                  <div className="pc-stat-item">
                    <span className="pc-stat-label">Active Polls</span>
                    <span className="pc-stat-value">{profile.statistics.activePolls ?? 0}</span>
                  </div>
                  <div className="pc-stat-item">
                    <span className="pc-stat-label">Ended Polls</span>
                    <span className="pc-stat-value">{profile.statistics.endedPolls ?? 0}</span>
                  </div>
                  <div className="pc-stat-item">
                    <span className="pc-stat-label">Votes Cast</span>
                    <span className="pc-stat-value">{profile.statistics.totalVotesCast ?? 0}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {showUserInfo && (
            <div className="pc-user-info">
              <div className="pc-user-details">
                <div className="pc-mini-avatar">
                  <img
                    src={displayMiniAvatar}
                    alt={`${displayName || "User"} mini avatar`}
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      console.warn("Mini avatar image failed to load:", displayMiniAvatar);
                    }}
                  />
                </div>
                <div className="pc-user-text">
                  <div className="pc-handle">@{displayHandle}</div>
                  <div className="pc-status">{displayStatus}</div>
                  {/* Remove balance display as it's not in the new response */}
                </div>
              </div>
              {/* <button
                className="pc-contact-btn"
                onClick={handleContactClick}
                type="button"
                aria-label={`Contact ${displayName || "user"}`}
              >
                {contactText}
              </button> */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProfileCard = React.memo(ProfileCardComponent);

export default ProfileCard;
