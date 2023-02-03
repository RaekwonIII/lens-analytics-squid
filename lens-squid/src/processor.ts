import { TypeormDatabase } from '@subsquid/typeorm-store';
import {EvmBatchProcessor} from '@subsquid/evm-processor'
import { lookupArchive } from '@subsquid/archive-registry'
import { events } from './abi/Events';
import { Burn } from './model';

const lensContractAddress = "0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d".toLowerCase();

const processor = new EvmBatchProcessor()
  .setDataSource({
    archive: lookupArchive('polygon'),
  })
  .addLog(lensContractAddress, {
    filter: [[ events.ProfileCreated.topic, events.PostCreated.topic, events.CommentCreated.topic, events.Followed.topic, events.MirrorCreated.topic, events.Collected.topic ]],
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

function formatID(height:any, hash:string) {
  return `${String(height).padStart(10, '0')}-${hash.slice(3,8)}` 

} 

processor.run(new TypeormDatabase(), async (ctx) => {
  const burns: Burn[] = []
  for (let c of ctx.blocks) {
    for (let i of c.items) {
      if (i.address === lensContractAddress && i.kind === 'evmLog') {
        if (i.evmLog.topics[0] === events.ProfileCreated.topic) {
          const { creator, handle, imageURI, profileId, to, timestamp } = events.ProfileCreated.decode(i.evmLog);
        }
        if (i.evmLog.topics[0] === events.PostCreated.topic) {
          const { profileId, pubId, contentURI, timestamp } = events.PostCreated.decode(i.evmLog);
        }
        if (i.evmLog.topics[0] === events.CommentCreated.topic) {
          const { profileId, pubId, profileIdPointed, pubIdPointed, contentURI, timestamp } = events.CommentCreated.decode(i.evmLog);
        }
        if (i.evmLog.topics[0] === events.Followed.topic) {
          const { follower, profileIds, timestamp } = events.Followed.decode(i.evmLog);
        }
        if (i.evmLog.topics[0] === events.MirrorCreated.topic) {
          const { profileId, pubId, profileIdPointed, pubIdPointed, timestamp } = events.MirrorCreated.decode(i.evmLog);
        }
        if (i.evmLog.topics[0] === events.Collected.topic) {
          const { collector, profileId, pubId, timestamp } = events.Collected.decode(i.evmLog);
        }

      }
    }
   }

   await ctx.store.save(burns)
});

