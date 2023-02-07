import { Store, TypeormDatabase } from "@subsquid/typeorm-store";
import {
  BlockHandlerContext,
  EvmBatchProcessor,
} from "@subsquid/evm-processor";
import { lookupArchive } from "@subsquid/archive-registry";
import { events } from "./abi/Events";
import { Profile, Post, Comment, Mirror, CollectAction } from "./model";
import { In } from "typeorm";

const lensContractAddress =
  "0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d".toLowerCase();

const processor = new EvmBatchProcessor()
  .setDataSource({
    archive: lookupArchive("polygon"),
  })
  .addLog(lensContractAddress, {
    filter: [
      [
        events.ProfileCreated.topic,
        events.PostCreated.topic,
        events.CommentCreated.topic,
        events.MirrorCreated.topic,
        events.Collected.topic,
      ],
    ],
    data: {
      evmLog: {
        topics: true,
        data: true,
      },
      transaction: {
        hash: true,
      },
    },
  });

function formatPostId(profileId: number, pubId: number) {
  return `${profileId - pubId}`;
}

type ProfileCreated = {
  handle: string;
  imageURI: string;
  profileId: number;
  to: string;
  timestamp: Date;
};

type PostCreated = {
  profileId: number;
  pubId: number;
  contentURI: string;
  timestamp: Date;
};

type CommentCreated = {
  profileId: number;
  pubId: number;
  profileIdPointed: number;
  pubIdPointed: number;
  contentURI: string;
  timestamp: Date;
};
type MirrorCreated = {
  profileId: number;
  pubId: number;
  profileIdPointed: number;
  pubIdPointed: number;
  timestamp: Date;
};

type CollectedEvent = {
  collector: string;
  profileId: number;
  pubId: number;
  timestamp: Date;
};

processor.run(new TypeormDatabase(), async (ctx) => {
  const profiles: ProfileCreated[] = [];
  const posts: PostCreated[] = [];
  const comments: CommentCreated[] = [];
  const mirrors: MirrorCreated[] = [];
  const collectedEvents: CollectedEvent[] = [];

  for (let c of ctx.blocks) {
    for (let i of c.items) {
      if (i.address === lensContractAddress && i.kind === "evmLog") {
        if (i.evmLog.topics[0] === events.ProfileCreated.topic) {
          const { handle, imageURI, profileId, to, timestamp } =
            events.ProfileCreated.decode(i.evmLog);
          profiles.push({
            handle,
            imageURI,
            profileId: profileId.toNumber(),
            to,
            timestamp: new Date(timestamp.toNumber() * 1000),
          });
          // ctx.log.info(`New profile found! Address: ${to}, profile id: ${profileId}`);
        }
        if (i.evmLog.topics[0] === events.PostCreated.topic) {
          try {
            const { profileId, pubId, contentURI, timestamp } =
              events.PostCreated.decode(i.evmLog);
            posts.push({
              profileId: profileId.toNumber(),
              pubId: pubId.toNumber(),
              contentURI,
              timestamp: new Date(timestamp.toNumber() * 1000),
            });
          } catch (error) {
            ctx.log.warn(`Error while decoding PostCreated event.`);
            if (error instanceof Error) {
              ctx.log.info(error.message);
            }
          }
          // ctx.log.info(`New Post found! PostID: ${pubId}, profile id: ${profileId}`);
        }
        if (i.evmLog.topics[0] === events.CommentCreated.topic) {
          try {
            const {
              profileId,
              pubId,
              profileIdPointed,
              pubIdPointed,
              contentURI,
              timestamp,
            } = events.CommentCreated.decode(i.evmLog);
            comments.push({
              profileId: profileId.toNumber(),
              pubId: pubId.toNumber(),
              profileIdPointed: profileIdPointed.toNumber(),
              pubIdPointed: pubIdPointed.toNumber(),
              contentURI,
              timestamp: new Date(timestamp.toNumber() * 1000),
            });
          } catch (error) {
            ctx.log.warn(`Error while decoding PostCreated event.`);
            if (error instanceof Error) {
              ctx.log.info(error.message);
            }
          }
        }
        if (i.evmLog.topics[0] === events.MirrorCreated.topic) {
          const {
            profileId,
            pubId,
            profileIdPointed,
            pubIdPointed,
            timestamp,
          } = events.MirrorCreated.decode(i.evmLog);
          mirrors.push({
            profileId: profileId.toNumber(),
            pubId: pubId.toNumber(),
            profileIdPointed: profileIdPointed.toNumber(),
            pubIdPointed: pubIdPointed.toNumber(),
            timestamp: new Date(timestamp.toNumber() * 1000),
          });
        }
        if (i.evmLog.topics[0] === events.Collected.topic) {
          const { collector, profileId, pubId, timestamp } =
            events.Collected.decode(i.evmLog);
          collectedEvents.push({
            collector,
            profileId: profileId.toNumber(),
            pubId: pubId.toNumber(),
            timestamp: new Date(timestamp.toNumber() * 1000),
          });
        }
      }
    }
  }

  await saveLensData(
    {
      ...ctx,
      block: ctx.blocks[ctx.blocks.length - 1].header,
    },
    profiles,
    posts,
    comments,
    mirrors,
    collectedEvents
  );
});

async function saveLensData(
  ctx: BlockHandlerContext<Store>,
  profiles: ProfileCreated[],
  posts: PostCreated[],
  comments: CommentCreated[],
  mirrors: MirrorCreated[],
  collectedEvents: CollectedEvent[]
) {
  const profileIds: Set<number> = new Set();
  const postIds: Set<string> = new Set();
  const commentIds: Set<string> = new Set();
  const mirrorIds: Set<string> = new Set();

  for (const profile of profiles) {
    profileIds.add(profile.profileId);
  }

  for (const post of posts) {
    postIds.add(formatPostId(post.profileId, post.pubId));
    profileIds.add(post.profileId);
  }

  for (const comment of comments) {
    postIds.add(formatPostId(comment.profileId, comment.pubId));
    postIds.add(formatPostId(comment.profileIdPointed, comment.pubIdPointed));
    commentIds.add(formatPostId(comment.profileId, comment.pubId));
    commentIds.add(
      formatPostId(comment.profileIdPointed, comment.pubIdPointed)
    );
    profileIds.add(comment.profileId);
    profileIds.add(comment.profileIdPointed);
  }

  for (const mirror of mirrors) {
    postIds.add(formatPostId(mirror.profileId, mirror.pubId));
    postIds.add(formatPostId(mirror.profileIdPointed, mirror.pubIdPointed));
    mirrorIds.add(formatPostId(mirror.profileId, mirror.pubId));
    mirrorIds.add(formatPostId(mirror.profileIdPointed, mirror.pubIdPointed));
    profileIds.add(mirror.profileId);
    profileIds.add(mirror.profileIdPointed);
  }

  // for (const collectedEvent of collectedEvents) {
  //   postIds.add(formatPostId(collectedEvent.profileId, collectedEvent.pubId));
  //   profileIds.add(collectedEvent.profileId);
  // }

  const profileModels: Map<string, Profile> = new Map(
    (await ctx.store.findBy(Profile, { id: In([...profileIds]) })).map(
      (profile) => [profile.profileId.toString(), profile]
    )
  );

  const postModels: Map<string, Post> = new Map(
    (await ctx.store.findBy(Post, { id: In([...postIds]) })).map((post) => [
      formatPostId(post.profileId, post.postId),
      post,
    ])
  );

  const commentModels: Map<string, Comment> = new Map(
    (await ctx.store.findBy(Comment, { id: In([...commentIds]) })).map(
      (comment) => [formatPostId(comment.profileId, comment.commentId), comment]
    )
  );

  const mirrorModels: Map<string, Mirror> = new Map(
    (await ctx.store.findBy(Mirror, { id: In([...mirrorIds]) })).map(
      (mirror) => [formatPostId(mirror.profileId, mirror.postId), mirror]
    )
  );

  for (const profile of profiles) {
    const { handle, imageURI, profileId, timestamp, to } = profile;
    let profileModel = profileModels.get(profileId.toString());
    if (profileModel == null) {
      profileModel = new Profile({
        id: profileId.toString(),
        profileId,
        timestamp,
      });
      profileModel.address = to;
      profileModel.handle = handle;
      profileModel.imageURI = imageURI;
      profileModels.set(profileModel.profileId.toString(), profileModel);
    }
  }

  for (const post of posts) {
    const { pubId, profileId, timestamp, contentURI } = post;
    // collect poster profile
    let profileModel = profileModels.get(profileId.toString());
    if (profileModel == null) {
      ctx.log.warn(
        `Missing profile with ID ${profileId} for post ${pubId}, creating it`
      );
      profileModel = new Profile({
        id: profileId.toString(),
        profileId,
        timestamp,
      });
      profileModels.set(profileId.toString(), profileModel);
    }
    let postModel = postModels.get(formatPostId(profileId, pubId));
    if (postModel == null) {
      postModel = new Post({
        id: formatPostId(profileId, pubId),
        contentURI,
        postId: pubId,
        profileId,
        creatorProfile: profileModel,
        timestamp,
      });
      postModels.set(formatPostId(profileId, pubId), postModel);
    }
  }

  for (const comment of comments) {
    const {
      pubId,
      profileId,
      timestamp,
      contentURI,
      profileIdPointed,
      pubIdPointed,
    } = comment;
    // collect pointed profile and pubblication
    let profilePointedModel = profileModels.get(profileIdPointed.toString());
    let postPointedModel = postModels.get(
      formatPostId(profileIdPointed, pubIdPointed)
    );
    if (profilePointedModel == null) {
      ctx.log.warn(
        `Profile ID ${profileIdPointed} for comment ${profileId}-${pubId} could not be found, creating it`
      );
      profilePointedModel = new Profile({
        id: profileIdPointed.toString(),
        profileId: profileIdPointed,
        timestamp,
      });
      profileModels.set(profileIdPointed.toString(), profilePointedModel);
    }
    if (postPointedModel == null) {
      ctx.log.warn(
        `Post ${profileIdPointed}-${pubIdPointed} for comment ${profileId}-${pubId} could not be found, creating it`
      );
      postPointedModel = new Post({
        id: formatPostId(profileIdPointed, pubIdPointed),
        postId: pubIdPointed,
        profileId: profileIdPointed,
        creatorProfile: profilePointedModel,
        timestamp,
      });
      postModels.set(
        formatPostId(profileIdPointed, pubIdPointed),
        postPointedModel
      );
    }
    // collect commenter profile
    let profileModel = profileModels.get(profileId.toString());
    if (profileModel == null) {
      ctx.log.warn(
        `Missing profile with ID ${profileId} for comment ${pubId}, creating it`
      );
      profileModel = new Profile({
        id: profileId.toString(),
        profileId,
        timestamp,
      });
      profileModels.set(profileId.toString(), profileModel);
    }
    // verify the post does not exist.
    let postModel = postModels.get(formatPostId(profileId, pubId));
    if (postModel == null) {
      // ctx.log.warn(`Missing post for comment ${pubId}, creating it`);
      postModel = new Post({
        id: formatPostId(profileId, pubId),
        contentURI,
        postId: pubId,
        profileId,
        creatorProfile: profileModel,
        timestamp,
      });
      postModels.set(formatPostId(profileId, pubId), postModel);
    }
    let commentModel = commentModels.get(formatPostId(profileId, pubId));
    if (commentModel == null) {
      commentModel = new Comment({
        id: formatPostId(profileId, pubId),
        contentURI,
        commentId: pubId,
        profileId,
        profile: profileModel,
        originalPostId: pubIdPointed,
        originalPost: postPointedModel,
        originalProfileId: profileIdPointed,
        originalProfile: profilePointedModel,
        timestamp,
      });
      commentModels.set(formatPostId(profileId, pubId), commentModel);
    }
  }

  for (const mirror of mirrors) {
    const { pubId, profileId, timestamp, profileIdPointed, pubIdPointed } =
      mirror;
    // collect pointed profile and pubblication
    let profilePointedModel = profileModels.get(profileIdPointed.toString());
    let postPointedModel = postModels.get(
      formatPostId(profileIdPointed, pubIdPointed)
    );
    if (profilePointedModel == null) {
      ctx.log.warn(
        `Profile ID ${profileIdPointed} for mirror ${profileId}-${pubId} could not be found, creating it`
      );
      profilePointedModel = new Profile({
        id: profileIdPointed.toString(),
        profileId: profileIdPointed,
        timestamp,
      });
      profileModels.set(profileIdPointed.toString(), profilePointedModel);
    }
    if (postPointedModel == null) {
      ctx.log.warn(
        `Post ${profileIdPointed}-${pubIdPointed} for mirror ${profileId}-${pubId} could not be found, creating it`
      );
      postPointedModel = new Post({
        id: formatPostId(profileIdPointed, pubIdPointed),
        postId: pubIdPointed,
        profileId: profileIdPointed,
        creatorProfile: profilePointedModel,
        timestamp,
      });
      postModels.set(
        formatPostId(profileIdPointed, pubIdPointed),
        postPointedModel
      );
    }
    // collect commenter profile
    let profileModel = profileModels.get(profileId.toString());
    if (profileModel == null) {
      ctx.log.warn(
        `Missing profile with ID ${profileId} for mirror ${pubId}, creating it`
      );
      profileModel = new Profile({
        id: profileId.toString(),
        profileId,
        timestamp,
      });
      profileModels.set(profileId.toString(), profileModel);
    }
    // verify the post does not exist.
    let postModel = postModels.get(formatPostId(profileId, pubId));
    if (postModel == null) {
      postModel = new Post({
        id: formatPostId(profileId, pubId),
        postId: pubId,
        profileId,
        creatorProfile: profileModel,
        timestamp,
      });
      postModels.set(formatPostId(profileId, pubId), postModel);
    }
    let mirrorModel = mirrorModels.get(formatPostId(profileId, pubId));
    if (mirrorModel == null) {
      // ctx.log.info(`Saving mirror with id: ${profileId}-${pubId}, for post: ${profileIdPointed}-${pubIdPointed}`)
      mirrorModel = new Mirror({
        id: formatPostId(profileId, pubId),
        postId: pubId,
        post: postModel,
        profileId,
        profile: profileModel,
        originalPostId: pubIdPointed,
        originalPost: postPointedModel,
        originalProfileId: profileIdPointed,
        originalProfile: profilePointedModel,
        timestamp,
      });
      mirrorModels.set(formatPostId(profileId, pubId), mirrorModel);
    }
  }

  await ctx.store.save([...profileModels.values()]);
  await ctx.store.save([...postModels.values()]);
  await ctx.store.save([...commentModels.values()]);
  // await ctx.store.save([...mirrorModels.values()]);
}
