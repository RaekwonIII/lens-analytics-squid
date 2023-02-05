import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, ManyToOne as ManyToOne_} from "typeorm"
import * as marshal from "./marshal"
import {Post} from "./post.model"
import {Profile} from "./profile.model"

@Entity_()
export class Mirror {
    constructor(props?: Partial<Mirror>) {
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

    @Index_()
    @Column_("int4", {nullable: false})
    profileId!: number

    @Index_()
    @ManyToOne_(() => Profile, {nullable: true})
    profile!: Profile

    @Index_()
    @Column_("int4", {nullable: false})
    originalPostId!: number

    @Index_()
    @ManyToOne_(() => Post, {nullable: true})
    originalPost!: Post

    @Column_("int4", {nullable: false})
    originalProfileId!: number

    @Index_()
    @ManyToOne_(() => Profile, {nullable: true})
    originalProfile!: Profile

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    timestamp!: bigint
}
