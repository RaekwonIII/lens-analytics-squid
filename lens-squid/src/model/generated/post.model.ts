import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToMany as OneToMany_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import {Mirror} from "./mirror.model"
import {Profile} from "./profile.model"

@Entity_()
export class Post {
    constructor(props?: Partial<Post>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("text", {nullable: true})
    contentURI!: string | undefined | null

    @Column_("int4", {nullable: false})
    postId!: number

    @Column_("int4", {nullable: false})
    profileId!: number

    @OneToMany_(() => Mirror, e => e.originalPost)
    mirrors!: Mirror[]

    @Index_()
    @ManyToOne_(() => Profile, {nullable: true})
    creatorProfile!: Profile

    @Index_()
    @Column_("timestamp with time zone", {nullable: false})
    timestamp!: Date
}
