import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import {Post} from "./post.model"
import {Profile} from "./profile.model"

@Entity_()
export class CollectAction {
    constructor(props?: Partial<CollectAction>) {
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
    creatorProfileId!: number

    @Index_()
    @ManyToOne_(() => Profile, {nullable: true})
    creatorProfile!: Profile

    @Index_()
    @ManyToOne_(() => Profile, {nullable: true})
    collectorProfile!: Profile

    @Index_()
    @Column_("timestamp with time zone", {nullable: false})
    timestamp!: Date
}
