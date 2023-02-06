import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import {Post} from "./post.model"
import {Profile} from "./profile.model"

@Entity_()
export class Mirror {
    constructor(props?: Partial<Mirror>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("int4", {nullable: false})
    postId!: number

    @Index_()
    @ManyToOne_(() => Post, {nullable: true})
    post!: Post

    @Column_("int4", {nullable: false})
    profileId!: number

    @Index_()
    @ManyToOne_(() => Profile, {nullable: true})
    profile!: Profile

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

    @Index_()
    @Column_("timestamp with time zone", {nullable: false})
    timestamp!: Date
}
