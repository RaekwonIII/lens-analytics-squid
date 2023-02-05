import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, ManyToOne as ManyToOne_} from "typeorm"
import * as marshal from "./marshal"
import {Post} from "./post.model"
import {Profile} from "./profile.model"

@Entity_()
export class CollectAction {
    constructor(props?: Partial<CollectAction>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @Column_("int4", {nullable: false})
    postId!: number

    @Index_()
    @ManyToOne_(() => Post, {nullable: true})
    post!: Post

    @Column_("int4", {nullable: false})
    creatorProfileId!: number

    @Index_()
    @ManyToOne_(() => Profile, {nullable: true})
    creatorProfile!: Profile

    @Index_()
    @ManyToOne_(() => Profile, {nullable: true})
    collectorProfile!: Profile

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    timestamp!: bigint
}
