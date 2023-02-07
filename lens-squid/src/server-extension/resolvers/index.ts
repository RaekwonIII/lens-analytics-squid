import 'reflect-metadata'
import type { EntityManager } from 'typeorm'
import { Field, ObjectType, Query, Resolver } from 'type-graphql'
import { Profile, Post, Comment, Mirror } from '../../model'

@ObjectType()
export class ProfilesDayData {
    @Field(() => Date, { nullable: false })
    day!: Date

    @Field(() => Number, {nullable: false})
    count!: number

    constructor(props: Partial<ProfilesDayData>) {
        Object.assign(this, props)
    }
}

@Resolver()
export class ProfilesDayDataResolver {
    constructor(private tx: () => Promise<EntityManager>) {}

    @Query(()=>[ProfilesDayData])
    async getProfilesDayData(): Promise<ProfilesDayData[]> {
        const manager = await this.tx()
        const repository = manager.getRepository(Profile)

        const data: {
            day: string
            count: number
        }[] = await repository.query(`
            SELECT DATE(timestamp) AS day, COUNT(*) as count
            FROM profile
            GROUP BY day
            ORDER BY day ASC
        `)
        return data.map(
            (i) => new ProfilesDayData({
                day: new Date(i.day),
                count: i.count
            })
        )
    }
}

@ObjectType()
export class PostDayData {
    @Field(() => Date, { nullable: false })
    day!: Date

    @Field(() => Number, {nullable: false})
    count!: number

    constructor(props: Partial<PostDayData>) {
        Object.assign(this, props)
    }
}

@Resolver()
export class PostDayDataResolver {
    constructor(private tx: () => Promise<EntityManager>) {}

    @Query(()=>[PostDayData])
    async getPostDayData(): Promise<PostDayData[]> {
        const manager = await this.tx()
        const repository = manager.getRepository(Post)

        const data: {
            day: string
            count: number
        }[] = await repository.query(`
            SELECT DATE(timestamp) AS day, COUNT(*) as count
            FROM post
            GROUP BY day
            ORDER BY day ASC
        `)
        return data.map(
            (i) => new PostDayData({
                day: new Date(i.day),
                count: i.count
            })
        )
    }
}

@ObjectType()
export class CommentDayData {
    @Field(() => Date, { nullable: false })
    day!: Date

    @Field(() => Number, {nullable: false})
    count!: number

    constructor(props: Partial<CommentDayData>) {
        Object.assign(this, props)
    }
}

@Resolver()
export class CommentDayDataResolver {
    constructor(private tx: () => Promise<EntityManager>) {}

    @Query(()=>[CommentDayData])
    async getCommentDayData(): Promise<CommentDayData[]> {
        const manager = await this.tx()
        const repository = manager.getRepository(Comment)

        const data: {
            day: string
            count: number
        }[] = await repository.query(`
            SELECT DATE(timestamp) AS day, COUNT(*) as count
            FROM comment
            GROUP BY day
            ORDER BY day ASC
        `)
        return data.map(
            (i) => new CommentDayData({
                day: new Date(i.day),
                count: i.count
            })
        )
    }
}

@ObjectType()
export class MirrorDayData {
    @Field(() => Date, { nullable: false })
    day!: Date

    @Field(() => Number, {nullable: false})
    count!: number

    constructor(props: Partial<MirrorDayData>) {
        Object.assign(this, props)
    }
}

@Resolver()
export class MirrorDayDataResolver {
    constructor(private tx: () => Promise<EntityManager>) {}

    @Query(()=>[MirrorDayData])
    async getMirrorDayData(): Promise<MirrorDayData[]> {
        const manager = await this.tx()
        const repository = manager.getRepository(Mirror)

        const data: {
            day: string
            count: number
        }[] = await repository.query(`
            SELECT DATE(timestamp) AS day, COUNT(*) as count
            FROM mirror
            GROUP BY day
            ORDER BY day ASC
        `)
        return data.map(
            (i) => new MirrorDayData({
                day: new Date(i.day),
                count: i.count
            })
        )
    }
}