import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {Profile} from "./profile.model"

@Entity_()
export class Post {
    constructor(props?: Partial<Post>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Column_("text", {nullable: false})
    contentURI!: string

    @Column_("int4", {nullable: false})
    postId!: number

    @Column_("int4", {nullable: false})
    profileId!: number

    @Index_()
    @ManyToOne_(() => Profile, {nullable: true})
    creatorProfile!: Profile

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    timestamp!: bigint
}
