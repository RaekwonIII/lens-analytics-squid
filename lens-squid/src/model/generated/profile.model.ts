import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"

@Entity_()
export class Profile {
    constructor(props?: Partial<Profile>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @Column_("text", {nullable: false})
    address!: string

    @Index_()
    @Column_("text", {nullable: false})
    creator!: string

    @Index_()
    @Column_("text", {nullable: false})
    handle!: string

    @Column_("text", {nullable: false})
    imageURI!: string

    @Column_("int4", {nullable: false})
    profileId!: number

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    timestamp!: bigint
}
